import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get schema registry for context
    const { data: schemaData, error: schemaError } = await supabase.functions.invoke('get-schema-registry');
    
    let schemaContext = '';
    if (!schemaError && schemaData) {
      schemaContext = `Available database tables and their schemas:\n${JSON.stringify(schemaData, null, 2)}`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // System prompt with schema context
    const systemPrompt = `You are an intelligent data assistant that helps users query and analyze their synced data.

${schemaContext}

You can help users:
- Query specific tables and filter data
- Aggregate and analyze data
- Answer questions about their data
- Provide insights and summaries

When users ask questions about their data, use the query_data tool to fetch the relevant information.

Always be concise and helpful. Format data in a readable way.`;

    // Prepare messages with system context
    const aiMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('Calling Lovable AI...');

    // Call Lovable AI with tool definitions
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'query_data',
              description: 'Query data from user tables. Use this to fetch specific data based on filters, sorting, and pagination.',
              parameters: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'The name of the table to query'
                  },
                  select: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Columns to select. Use ["*"] for all columns.'
                  },
                  filters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        column: { type: 'string' },
                        operator: { type: 'string', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike'] },
                        value: { type: 'string' }
                      }
                    },
                    description: 'Filters to apply to the query'
                  },
                  sort: {
                    type: 'object',
                    properties: {
                      column: { type: 'string' },
                      order: { type: 'string', enum: ['asc', 'desc'] }
                    },
                    description: 'Sort order for results'
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of records to return'
                  }
                },
                required: ['table']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'aggregate_data',
              description: 'Perform aggregations on data like COUNT, SUM, AVG, MIN, MAX with optional grouping.',
              parameters: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'The name of the table to aggregate'
                  },
                  aggregation: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['count', 'sum', 'avg', 'min', 'max'] },
                      column: { type: 'string' },
                      groupBy: { type: 'string' }
                    },
                    required: ['type', 'column']
                  }
                },
                required: ['table', 'aggregation']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiResult, null, 2));

    const choice = aiResult.choices[0];
    
    // Check if AI wants to use tools
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Executing tool: ${functionName}`, functionArgs);

      let toolResult;
      
      if (functionName === 'query_data') {
        const { data: queryData, error: queryError } = await supabase.functions.invoke('query-builder', {
          body: functionArgs
        });

        if (queryError) {
          toolResult = { error: queryError.message };
        } else {
          toolResult = queryData;
        }
      } else if (functionName === 'aggregate_data') {
        const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('analytics-query', {
          body: functionArgs
        });

        if (analyticsError) {
          toolResult = { error: analyticsError.message };
        } else {
          toolResult = analyticsData;
        }
      }

      console.log('Tool result:', JSON.stringify(toolResult, null, 2));

      // Send tool result back to AI for final response
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            ...aiMessages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            }
          ]
        }),
      });

      const finalResult = await finalResponse.json();
      const finalMessage = finalResult.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          message: finalMessage,
          data: toolResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No tool calls, return AI response directly
    return new Response(
      JSON.stringify({ 
        message: choice.message.content 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-query function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
