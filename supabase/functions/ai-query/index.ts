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

QUERY CAPABILITIES:
1. Single-table queries with filtering, sorting, and pagination
2. Data aggregations (COUNT, SUM, AVG, MIN, MAX)
3. Multi-table queries via sequential tool calls

HANDLING MULTI-TABLE QUERIES:
When users ask for data that spans multiple tables (e.g., "assessments from the 2020 period"):
1. First query the reference table to get IDs (e.g., query assessment_periods WHERE name contains '2020')
2. Then query the main table using those IDs as a filter (e.g., query assessments WHERE assessment_period_id equals the ID from step 1)
3. Explain what you're doing: "I'll first find the period ID, then query assessments from that period"

OPERATOR USAGE:
- Use 'equals' for exact matches (e.g., status equals 'Active')
- Use 'contains' for text search (e.g., name contains 'Risk')
- Use 'in' for matching multiple values (e.g., id in [1, 2, 3])
- Use 'gt', 'gte', 'lt', 'lte' for numeric/date comparisons

RELATIONSHIPS IN THE DATABASE:
- assessments.assessment_period_id → assessment_periods.id
- entities.auditable_entity_type_id → entity_types.id
- entity_risks.entity_id → entities.id
- entity_risks.risk_id → risks.id
- risks.risk_category_id → risk_categories.id

Always be concise and helpful. Format data in a readable way. When executing multi-table queries, briefly explain your approach.`;

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
                        operator: { type: 'string', enum: ['equals', 'not_equals', 'contains', 'gt', 'gte', 'lt', 'lte', 'in'] },
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
