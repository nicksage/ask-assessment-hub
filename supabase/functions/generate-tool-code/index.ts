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

    const { tool_definition, schema_registry } = await req.json();

    if (!tool_definition) {
      return new Response(JSON.stringify({ error: 'Tool definition is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use provided schema or fetch it
    let schemaData = schema_registry;
    if (!schemaData) {
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

    // Check if user has OpenAI configured for better code generation
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('provider, openai_api_key')
      .eq('user_id', user.id)
      .single();

    const useOpenAI = aiSettings?.provider === 'openai' && aiSettings?.openai_api_key;
    console.log('Using AI provider:', useOpenAI ? 'OpenAI' : 'Lovable AI (Gemini)');

    const systemPrompt = `You are an expert at generating database query logic for Supabase.

⚠️ BEFORE WRITING CODE - VERIFICATION CHECKLIST:

<checklist>
□ I have listed all columns I will use from available_column_names
□ I verified every column name matches the schema exactly
□ I examined sample_data to understand actual data patterns
□ For _id columns, I checked column_stats to see common values
□ I identified the target table for each _id column
□ I planned the query sequence (table order matters)
□ I will NOT use .select('other_table(*)') syntax
□ I will use .in() for multi-table filtering
□ I will manually enrich results, not use joins
□ I will add console.log for debugging
□ I will validate all input parameters
□ I will handle errors with try-catch
</checklist>

Generate JavaScript/TypeScript code that implements this tool:

Tool Details:
${JSON.stringify(tool_definition, null, 2)}

Database Schema with Sample Data & Statistics:
${JSON.stringify(schemaData, null, 2)}

⚠️ CRITICAL DATABASE CONSTRAINTS:
1. There are NO foreign key constraints in this database
2. You MUST only use column names from the schema's available_column_names arrays
3. For multi-table queries, you MUST query tables sequentially
4. You cannot use Supabase joins or foreign key syntax like .select('risks(*)')

⚠️ HANDLING RELATIONSHIP COLUMNS:
- Any column ending in _id suggests a relationship to another table
- Check the 'suggested_relationships' field in each table's schema  
- If filtering by type/category name, query the related table first to get IDs
- Then use .in() to filter the main table by those IDs

BEFORE WRITING CODE:
1. List the exact columns available in each table you'll query (from available_column_names)
2. Verify all column names match the schema exactly
3. Plan the query sequence if multiple tables are needed
4. Check suggested_relationships for potential links

Requirements:
1. Generate ONLY the query logic, NOT a complete edge function
2. Do NOT include any import statements
3. Do NOT include Deno.serve or CORS headers
4. The code will receive these parameters:
   - supabase: Authenticated Supabase client (already set up with user's RLS)
   - args: Object containing the tool parameters
   - console: For logging
   - JSON: For JSON operations
5. Use Supabase client methods ONLY (never raw SQL)
6. Return a structured object: { success: true, count: number, data: array }
7. Handle errors with try-catch and return: { success: false, error: string }
8. Add console.log statements for debugging
9. Validate all input parameters from args object

SINGLE TABLE QUERY EXAMPLE:
try {
  console.log('Executing tool with args:', args);
  
  if (!args.status) {
    return { success: false, error: 'status is required' };
  }
  
  const { data, error } = await supabase
    .from('assessments')
    .select('id, name, status, type')
    .eq('status', args.status)
    .limit(100);
  
  if (error) {
    console.error('Query error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('Query successful, returned', data.length, 'rows');
  return { success: true, count: data.length, data };
} catch (error) {
  console.error('Execution error:', error);
  return { success: false, error: error.message };
}

REAL-WORLD EXAMPLE - Entities by Type:

User asks: "Get all Department entities"
Schema shows: 
  - entities table: auditable_entity_type_id (bigint), id (bigint), name (text)
  - entity_types table: id (bigint), name (text), key (text)
  - Suggested relationship: entities.auditable_entity_type_id → entity_types.id

Generated code:
try {
  console.log('Executing tool with args:', args);
  
  if (!args.type_name) {
    return { success: false, error: 'type_name parameter is required' };
  }
  
  // Step 1: Find entity type IDs by name
  const { data: entityTypes, error: typeError } = await supabase
    .from('entity_types')
    .select('id, name, key')
    .ilike('name', \`%\${args.type_name}%\`);
  
  if (typeError) {
    console.error('Entity type query error:', typeError);
    return { success: false, error: typeError.message };
  }
  
  if (entityTypes.length === 0) {
    return { 
      success: true, 
      count: 0, 
      data: [], 
      message: 'No entity types found matching that name' 
    };
  }
  
  const typeIds = entityTypes.map(t => t.id);
  console.log('Found entity type IDs:', typeIds);
  
  // Step 2: Get entities with those type IDs
  const { data: entities, error: entityError } = await supabase
    .from('entities')
    .select('id, name, auditable_entity_type_id, description, created_at')
    .in('auditable_entity_type_id', typeIds);
  
  if (entityError) {
    console.error('Entity query error:', entityError);
    return { success: false, error: entityError.message };
  }
  
  // Step 3: Enrich entities with type name
  const enriched = entities.map(entity => ({
    ...entity,
    entity_type_name: entityTypes.find(t => t.id === entity.auditable_entity_type_id)?.name
  }));
  
  console.log('Query successful, returned', enriched.length, 'entities');
  return { success: true, count: enriched.length, data: enriched };
  
} catch (error) {
  console.error('Execution error:', error);
  return { success: false, error: error.message };
}

COLUMN NAME VALIDATION (CRITICAL):
- ONLY use column names from the schema's available_column_names array
- NEVER assume or invent column names (e.g., no 'type' column in entities)
- NEVER use foreign key syntax like .select('risks(*)')
- NEVER use !inner joins - there are no foreign keys
- If a column ends in _id, it's a number field suggesting a relationship

FORBIDDEN PATTERNS (will cause errors):
❌ .select('risks(*)') - No foreign key relationships
❌ .select('*, risk_categories!inner(*)') - No joins available
❌ Assuming column names exist without checking schema
❌ Using columns not listed in the schema

Return ONLY the query logic code, nothing else.`;

    // Configure AI model based on user settings
    const aiConfig = useOpenAI 
      ? {
          url: 'https://api.openai.com/v1/chat/completions',
          apiKey: aiSettings.openai_api_key,
          model: 'gpt-5-2025-08-07'
        }
      : {
          url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
          apiKey: LOVABLE_API_KEY,
          model: 'google/gemini-2.5-flash'
        };

    // Build request body
    const requestBody: any = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the complete edge function code.' }
      ]
    };

    // Only add temperature for OpenAI - Gemini doesn't support custom temperature
    if (useOpenAI) {
      requestBody.temperature = 0.1;
    }
    
    console.log('Request body config:', { model: requestBody.model, hasTemperature: 'temperature' in requestBody });

    const response = await fetch(aiConfig.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate tool code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    let code = aiResponse.choices[0].message.content;

    // Extract code from markdown blocks if present
    const codeBlockMatch = code.match(/```(?:typescript|ts|javascript|js)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }

    // Remove any accidental import statements
    code = code.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    code = code.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

    // Remove Deno.serve wrapper if present
    code = code.replace(/Deno\.serve\(async\s*\(req\)\s*=>\s*\{[\s\S]*$/, '');
    code = code.replace(/^\}\);?\s*$/gm, '');
    
    // Remove CORS headers definitions
    code = code.replace(/const\s+corsHeaders\s*=\s*\{[\s\S]*?\};?\s*/g, '');
    
    // Clean up extra whitespace
    code = code.trim();

    // Validate column names against schema
    const validation = validateGeneratedCode(code, schemaData, tool_definition.tables_used);
    if (!validation.valid) {
      console.error('Column validation failed:', validation.errors);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Generated code uses invalid columns: ${validation.errors.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      edge_function_code: code.trim()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-tool-code:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractColumnNames(code: string): Map<string, string[]> {
  const tableColumns = new Map<string, string[]>();
  
  // Extract .from('table_name') to identify tables
  const fromPattern = /\.from\(['"](\w+)['"]\)/g;
  const tables = new Set<string>();
  let match;
  while ((match = fromPattern.exec(code)) !== null) {
    tables.add(match[1]);
  }
  
  // For each table, extract column names used in that context
  tables.forEach(table => {
    const columns = new Set<string>();
    
    // Find all .select, .eq, .in, .ilike patterns after this table
    const tableContext = code.split(`.from('${table}')`)[1]?.split('.from(')[0] || '';
    
    // Extract from .select()
    const selectPattern = /\.select\(['"]([^'"]+)['"]\)/g;
    while ((match = selectPattern.exec(tableContext)) !== null) {
      match[1].split(',').forEach(col => {
        const cleanCol = col.trim().split(' ')[0]; // Remove aliases
        if (cleanCol !== '*') columns.add(cleanCol);
      });
    }
    
    // Extract from .eq(), .in(), .ilike(), etc.
    const filterPattern = /\.(eq|in|ilike|gt|gte|lt|lte|neq)\(['"](\w+)['"]/g;
    while ((match = filterPattern.exec(tableContext)) !== null) {
      columns.add(match[2]);
    }
    
    tableColumns.set(table, Array.from(columns));
  });
  
  return tableColumns;
}

function validateGeneratedCode(
  code: string, 
  schema: any, 
  tablesUsed: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const usedColumns = extractColumnNames(code);
  
  usedColumns.forEach((columns, tableName) => {
    const tableSchema = schema.tables?.find((t: any) => t.table_name === tableName);
    
    if (!tableSchema) {
      errors.push(`Table '${tableName}' not found in schema`);
      return;
    }
    
    const availableColumns = tableSchema.available_column_names || [];
    
    columns.forEach(col => {
      if (!availableColumns.includes(col)) {
        errors.push(`Column '${col}' does not exist in table '${tableName}'. Available: ${availableColumns.join(', ')}`);
      }
    });
  });
  
  return { valid: errors.length === 0, errors };
}
