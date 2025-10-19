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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert at generating database query logic for Supabase.

Generate JavaScript/TypeScript code that implements this tool:

Tool Details:
${JSON.stringify(tool_definition, null, 2)}

Database Schema:
${JSON.stringify(schema_registry, null, 2)}

⚠️ CRITICAL DATABASE CONSTRAINTS:
1. There are NO foreign key relationships in this database
2. You MUST only use column names that exist in the schema exactly as shown
3. For multi-table queries, you MUST query tables sequentially, NOT with joins
4. You CANNOT use Supabase's automatic joins or foreign key selects
5. All columns ending in _id are just number/text fields, NOT relationships

BEFORE WRITING CODE:
1. List the exact columns available in each table you'll query from the schema
2. Verify the column names match the schema exactly (case-sensitive)
3. Plan the query sequence if multiple tables are needed

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

MULTI-TABLE QUERY PATTERN (NO FOREIGN KEYS):
try {
  console.log('Executing tool with args:', args);
  
  if (!args.category_name) {
    return { success: false, error: 'category_name is required' };
  }
  
  // Step 1: Find category IDs matching the filter
  const { data: categories, error: catError } = await supabase
    .from('risk_categories')
    .select('id, name')
    .ilike('name', \`%\${args.category_name}%\`);
  
  if (catError) {
    console.error('Category query error:', catError);
    return { success: false, error: catError.message };
  }
  
  if (categories.length === 0) {
    return { success: true, count: 0, data: [], message: 'No matching categories found' };
  }
  
  const categoryIds = categories.map(c => c.id);
  console.log('Found category IDs:', categoryIds);
  
  // Step 2: Get risks for those categories using .in()
  const { data: risks, error: riskError } = await supabase
    .from('risks')
    .select('id, name, risk_category_id, status, description')
    .in('risk_category_id', categoryIds);
  
  if (riskError) {
    console.error('Risk query error:', riskError);
    return { success: false, error: riskError.message };
  }
  
  // Step 3: Manually combine results
  const combined = risks.map(risk => ({
    ...risk,
    category_name: categories.find(c => c.id === risk.risk_category_id)?.name
  }));
  
  console.log('Query successful, returned', combined.length, 'risks');
  return { success: true, count: combined.length, data: combined };
} catch (error) {
  console.error('Execution error:', error);
  return { success: false, error: error.message };
}

FORBIDDEN PATTERNS (will cause errors):
❌ .select('risks(*)') - No foreign key relationships
❌ .select('*, risk_categories!inner(*)') - No joins available
❌ Assuming column names exist without checking schema
❌ Using columns not listed in the schema

Return ONLY the query logic code, nothing else.`;

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
          { role: 'user', content: 'Generate the complete edge function code.' }
        ],
        temperature: 0.3,
      }),
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
