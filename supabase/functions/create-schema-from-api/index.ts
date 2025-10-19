import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, columns, endpointId } = await req.json();

    if (!tableName || !columns || !Array.isArray(columns)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating schema for user:', user.id);
    console.log('Table name:', tableName);
    console.log('Columns:', JSON.stringify(columns, null, 2));

    // Call the PostgreSQL function to create the table
    const { data: result, error: createError } = await supabase
      .rpc('create_user_table_from_schema', {
        p_table_name: tableName,
        p_columns: columns,
        p_user_id: user.id
      });

    if (createError) {
      console.error('Error creating table:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create table', details: createError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result.success) {
      console.error('Table creation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Table created successfully:', result.table_name);

    // Create the schema mapping record
    const { data: mapping, error: mappingError } = await supabase
      .from('api_schema_mappings')
      .insert({
        user_id: user.id,
        endpoint_id: endpointId || null,
        table_name: tableName,
        column_mappings: columns,
      })
      .select()
      .single();

    if (mappingError) {
      console.error('Error creating schema mapping:', mappingError);
      return new Response(
        JSON.stringify({ error: 'Failed to create schema mapping', details: mappingError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Schema mapping created:', mapping);

    return new Response(
      JSON.stringify({ 
        success: true, 
        mapping,
        tableName: result.table_name,
        message: 'Table created successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-schema-from-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
