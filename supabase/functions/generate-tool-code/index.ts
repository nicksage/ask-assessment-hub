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

    const systemPrompt = `You are an expert at generating Supabase edge function code.

Generate TypeScript code for a Supabase edge function that implements this tool:

Tool Details:
${JSON.stringify(tool_definition, null, 2)}

Database Schema:
${JSON.stringify(schema_registry, null, 2)}

Requirements:
1. Use Supabase client methods ONLY (never raw SQL)
2. Include proper CORS headers
3. Authenticate using JWT from Authorization header
4. Parse parameters from request body
5. Use RLS-aware queries (will inherit user's permissions)
6. Return structured JSON: { success: true, count: number, data: array }
7. Handle errors gracefully
8. Add console.log statements for debugging
9. Validate all input parameters
10. Use proper TypeScript types

Return ONLY the complete TypeScript code, nothing else. The code must be ready to execute.`;

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
    const codeBlockMatch = code.match(/```typescript\n([\s\S]*?)\n```/) || 
                           code.match(/```ts\n([\s\S]*?)\n```/) ||
                           code.match(/```\n([\s\S]*?)\n```/);
    
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
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
