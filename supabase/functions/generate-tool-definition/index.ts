import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { description, schema_registry } = await req.json();

    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use provided schema or fetch it
    let schemaData = schema_registry;
    if (!schemaData) {
      // Get schema context
      const { data: fetchedSchema } = await supabase.functions.invoke('get-schema-registry');
      schemaData = fetchedSchema;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a tool definition generator for a data query system.

Based on the user's description and database schema, generate a complete tool definition for the OpenAI function calling format.

Database Schema:
${JSON.stringify(schemaData, null, 2)}

⚠️ CRITICAL DATABASE CONSTRAINTS:
1. There are NO foreign key constraints in this database
2. You MUST only use column names that exist in the schema's available_column_names
3. For multi-table queries, you MUST query tables sequentially using .in() filters
4. You cannot use Supabase's automatic joins or foreign key selects

⚠️ HANDLING RELATIONSHIP COLUMNS (_id columns):
- Any column ending in _id (like 'auditable_entity_type_id', 'risk_category_id') suggests a relationship
- Check the 'suggested_relationships' field in each table's schema
- If the user asks to filter by a "type" or "category", they likely mean data from the related table
- You MUST query the related table first to get the ID, then use that ID to query the main table

EXAMPLE - "Get entities by type":
Problem: User wants entities filtered by type name like "Department"
Available: entities.auditable_entity_type_id (bigint), entity_types.name (text)
Solution Steps:
  1. Query entity_types WHERE name matches → Get entity_types.id values
  2. Query entities WHERE auditable_entity_type_id IN [extracted_ids]
  3. Optionally enrich results by mapping entity_types.name back

BEFORE generating tool definition:
1. List all columns ending in _id from the target table
2. Check suggested_relationships for potential links
3. Plan the multi-step query sequence in query_logic

VALIDATION RULES:
1. Review the available_column_names for each table in the schema
2. Only use column names that exist in the schema exactly as shown
3. Parameters must correspond to actual column names
4. If the tool needs data from multiple tables, specify in query_logic that it will:
   - Query table A first to get matching records
   - Extract IDs from results
   - Query table B using .in() filter with those IDs
   - Manually combine the results

Rules:
1. Function name must be snake_case, descriptive, prefixed with "get_" or "list_"
2. Include clear description of what the tool does
3. Define parameters with proper types (string, number, boolean, array)
4. Include which tables will be queried in "tables_used"
5. In "query_logic", explicitly state if multiple sequential queries are needed
6. Keep parameters simple and practical

Example query_logic for multi-table:
"No foreign keys - requires sequential queries: First query entity_types table to find types matching the filter. Extract the 'id' values from results. Then query entities table using .in('auditable_entity_type_id', extracted_ids). Manually combine results with type names."

Return ONLY valid JSON in this exact format:
{
  "function_name": "get_example_data",
  "description": "Clear description of what this tool does",
  "parameters": {
    "type": "object",
    "properties": {
      "param_name": {
        "type": "string",
        "description": "What this parameter does"
      }
    },
    "required": ["param_name"]
  },
  "tables_used": ["table1", "table2"],
  "query_logic": "Plain English description of the query logic, including sequential query steps if multiple tables"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a tool definition for: ${description}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate tool definition' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    
    // Parse JSON from AI response
    let toolDefinition;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        toolDefinition = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse tool definition',
        details: content
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build OpenAI tool schema format
    const openAIToolSchema = {
      type: 'function',
      function: {
        name: toolDefinition.function_name,
        description: toolDefinition.description,
        parameters: toolDefinition.parameters
      }
    };

    return new Response(JSON.stringify({
      success: true,
      tool_definition: {
        ...toolDefinition,
        tool_schema: openAIToolSchema
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-tool-definition:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
