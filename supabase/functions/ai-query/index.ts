import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
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
3. Multi-table queries via multiple tool calls (sequential or parallel)

TOOL EXECUTION STRATEGY:
You can make multiple tool calls to answer complex questions. Choose the right approach:

**Sequential Tool Calls** (when data from one query is needed for the next):
Example: "Show me assessments from the 2020 period"
1. First call: query assessment_periods WHERE name contains '2020' → Get period ID (e.g., 17)
2. Second call: query assessments WHERE assessment_period_id equals '17' → Get assessments
3. Synthesize: "I found X assessments from the 2020 period..."

**Parallel Tool Calls** (when queries are independent):
Example: "Compare the number of risks per category"
1. Simultaneously call: query risk_categories to get all category IDs and names
2. Process results and answer

HANDLING MULTI-TABLE QUERIES:
When users ask for data that spans multiple tables:
1. Identify which tables you need and what relationships connect them
2. Plan your tool calls (sequential if dependent, parallel if independent)
3. Execute the calls - I will run them and send results back to you
4. You can make additional calls if needed based on the results
5. Synthesize the final answer for the user

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

DOMAIN KNOWLEDGE - CRITICAL COLUMN MEANINGS:

**Assessments Table:**
- type: Assessment category (e.g., "SOX", "Operational", "IT", "Compliance"). When users ask for "assessment types", they mean this column
- status: Current state (e.g., "Draft", "In Progress", "Finalized", "Cancelled")
- assessment_period_id: Links to assessment_periods table for time-based grouping (e.g., "2020", "Q1 2021")
- name: The assessment title/name
- due_date, started_date, finalized_date: Key tracking dates for assessment lifecycle
- assessment_template_id: Links to the template used for this assessment

**Entities Table:**
- auditable_entity_type_id: Links to entity_types, defines what kind of entity (process, system, vendor, department)
- name: The entity name/title
- status: Current entity status
- inherent_risk, residual_risk: Risk scores (stored as JSON/text with numeric values)
- description: Detailed entity information
- prior_audit_id, upcoming_audit_id: Links to past and future audits
- Custom fields: Many custom_text*, custom_date*, custom_select* fields for flexible data

**Risks Table:**
- risk_category_id: Links to risk_categories (e.g., "Operational", "Financial", "Compliance", "Strategic")
- risk_type_id: Further classification of risk type
- name: The risk name/title
- status: Current risk status
- inherent_risk, residual_risk: Risk assessment scores
- description: Detailed risk description
- activity: Risk-related activities
- mitigation_factors: How the risk is being mitigated

**Entity_Risks Table:**
- Junction table connecting entities to their associated risks
- entity_id: References entities.id
- risk_id: References risks.id
- status: Status of this specific entity-risk relationship

**Assessment_Periods Table:**
- name: Period name (e.g., "2020", "Q1 2021", "FY2022")
- sort_order: For chronological ordering

**Entity_Types Table:**
- name: Type name (e.g., "Process", "System", "Vendor", "Department")
- key: Technical identifier
- inventory_class: Higher-level grouping

**Risk_Categories Table:**
- name: Category name (e.g., "Operational", "Financial", "Compliance", "Strategic")
- key: Technical identifier
- is_default: Whether this is a default category

COMMON QUERY PATTERNS:
1. "Show me SOX assessments" → Query assessments WHERE type equals 'SOX'
2. "What assessments are from 2020?" → First query assessment_periods WHERE name contains '2020', then query assessments with that period_id
3. "List all operational risks" → First query risk_categories WHERE name equals 'Operational', then query risks with that category_id
4. "Which entities are linked to [risk name]?" → First find risk by name, then query entity_risks with that risk_id, then get entity details
5. "Show finalized assessments" → Query assessments WHERE status equals 'Finalized'
6. "Count risks by category" → Use aggregate_data to COUNT risks grouped by risk_category_id

KEY INSIGHTS:
- When users mention "assessment types", they mean the 'type' column in assessments table
- When users mention "risk categories", they mean the risk_category_id relationship to risk_categories table
- Date fields may be stored as text in ISO format - use string comparison operators
- JSON fields like inherent_risk contain nested data structures
- Many ID fields ending in _id are foreign keys to other tables
- The 'status' field appears in multiple tables and indicates current state/progress
- Custom fields (custom_text*, custom_date*, custom_select*) allow flexible data storage

Always be concise and helpful. Format data in a readable way. When executing multi-table queries, briefly explain your approach.`;

    // Prepare messages with system context
    const aiMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('Calling Lovable AI...');

    // Define tools array for reuse in iterations
    const tools = [
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
        ];

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
        tools: tools,
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

    // Implement iterative tool call loop for multi-step queries
    const conversationHistory = [...aiMessages];
    let currentResponse = aiResult;
    let iterationCount = 0;
    const MAX_ITERATIONS = 5; // Prevent infinite loops
    let allToolResults: any[] = [];

    while (
      currentResponse.choices[0].message.tool_calls && 
      currentResponse.choices[0].message.tool_calls.length > 0 &&
      iterationCount < MAX_ITERATIONS
    ) {
      iterationCount++;
      const toolCalls = currentResponse.choices[0].message.tool_calls;
      
      console.log(`Iteration ${iterationCount}: Processing ${toolCalls.length} tool call(s)`);
      
      // Add AI's tool request to conversation history
      conversationHistory.push(currentResponse.choices[0].message);
      
      // Execute ALL tool calls in parallel
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, functionArgs);
          
          let result;
          if (functionName === 'query_data') {
            const { data: queryData, error: queryError } = await supabase.functions.invoke('query-builder', {
              body: functionArgs
            });
            result = queryError ? { error: queryError.message } : queryData;
          } else if (functionName === 'aggregate_data') {
            const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('analytics-query', {
              body: functionArgs
            });
            result = analyticsError ? { error: analyticsError.message } : analyticsData;
          }
          
          console.log(`Tool result for ${functionName}:`, JSON.stringify(result, null, 2));
          
          // Store result for final response
          allToolResults.push(result);
          
          return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          };
        })
      );
      
      // Add all tool results to conversation history
      conversationHistory.push(...toolResults);
      
      // Send back to AI for next decision
      const nextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationHistory,
          tools: tools // Keep tools available for next iteration
        }),
      });
      
      if (!nextResponse.ok) {
        const errorText = await nextResponse.text();
        console.error('Lovable AI error in iteration:', nextResponse.status, errorText);
        throw new Error(`AI request failed in iteration ${iterationCount}: ${nextResponse.status}`);
      }
      
      currentResponse = await nextResponse.json();
      console.log(`Iteration ${iterationCount} complete. AI response:`, JSON.stringify(currentResponse.choices[0].message, null, 2));
    }

    // After loop: AI has final answer (no more tool calls)
    const finalMessage = currentResponse.choices[0].message.content;
    
    console.log(`Query completed after ${iterationCount} iteration(s)`);

    return new Response(
      JSON.stringify({ 
        message: finalMessage,
        data: allToolResults.length > 0 ? allToolResults : undefined,
        iterations: iterationCount
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
