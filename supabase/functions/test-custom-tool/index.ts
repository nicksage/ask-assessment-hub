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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { code, params, tool_definition } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Testing tool code with params:', params);

    // Validate params against tool schema
    const validationErrors = validateParams(params || {}, tool_definition?.tool_schema);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Parameter validation failed",
        validation_errors: validationErrors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute the code in test mode
    try {
      console.log('Executing tool code in test mode');
      
      // Create a sandboxed context with only Supabase client access
      const executionContext = {
        supabase: createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        }), // User's authenticated client with proper RLS
        args: params || {},
        console: console,
        JSON: JSON,
      };

      // Wrap code in async function with better error handling
      const wrappedCode = `
        (async function(supabase, args, console, JSON) {
          try {
            console.log('[TEST] Starting code execution with args:', args);
            const result = await (async function() {
              ${code}
            })();
            console.log('[TEST] Code execution completed, result:', result);
            return result;
          } catch (innerError) {
            console.error('[TEST] Error during code execution:', innerError);
            throw innerError;
          }
        })
      `;

      console.log('[TEST] About to eval and execute code');
      const executeFunc = eval(wrappedCode);
      const result = await executeFunc(
        executionContext.supabase,
        executionContext.args,
        executionContext.console,
        executionContext.JSON
      );

      console.log('[TEST] Final result:', result);

      if (!result) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Code executed but returned no result. Make sure your code returns an object with { success, count, data }',
          test_mode: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        ...result,
        test_mode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (execError) {
      console.error('Tool execution error:', execError);
      const suggestion = analyzeErrorAndSuggest(execError, tool_definition);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: execError instanceof Error ? execError.message : 'Execution failed',
        stack: execError instanceof Error ? execError.stack : undefined,
        suggestion,
        test_mode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in test-custom-tool:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function validateParams(params: any, toolSchema: any): string[] {
  const errors: string[] = [];
  
  if (!toolSchema?.function?.parameters) {
    return errors;
  }

  const schema = toolSchema.function.parameters;
  const required = schema.required || [];

  // Check required parameters
  required.forEach((param: string) => {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      errors.push(`Required parameter '${param}' is missing`);
    }
  });

  // Validate parameter types
  Object.keys(params).forEach(key => {
    const propSchema = schema.properties?.[key];
    if (!propSchema) {
      errors.push(`Unknown parameter '${key}'`);
      return;
    }

    const value = params[key];
    const expectedType = propSchema.type;

    if (expectedType === 'number' && typeof value !== 'number') {
      errors.push(`Parameter '${key}' should be a number`);
    }
    if (expectedType === 'string' && typeof value !== 'string') {
      errors.push(`Parameter '${key}' should be a string`);
    }
    if (expectedType === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter '${key}' should be a boolean`);
    }
  });

  return errors;
}

function analyzeErrorAndSuggest(error: any, toolDef: any): string {
  const message = error?.message || '';
  
  if (message.includes('column') && message.includes('does not exist')) {
    return "The tool code uses a non-existent column. Try regenerating with the 'Regenerate Code' button.";
  }
  if (message.includes('relation') && message.includes('does not exist')) {
    return "The tool tries to query a table that doesn't exist. Check your table selection and regenerate.";
  }
  if (message.includes('null value in column')) {
    return "A required parameter is missing or null. Make sure to provide all required test values.";
  }
  if (message.includes('permission denied')) {
    return "Permission denied. This might be an RLS policy issue or you don't have access to this data.";
  }
  if (message.includes('undefined') || message.includes('is not a function')) {
    return "The generated code has a syntax error. Try regenerating the tool code.";
  }
  
  return "Review the error message above and try regenerating the code with more specific instructions.";
}
