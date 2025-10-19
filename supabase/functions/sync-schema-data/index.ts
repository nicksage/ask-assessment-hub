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
    const { endpointId, tableName, newData } = await req.json();

    if (!endpointId || !tableName || !newData) {
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

    console.log('Syncing data for user:', user.id);
    console.log('Table name:', tableName);

    // Get the schema mapping to understand column structure
    const { data: schemaMapping, error: mappingError } = await supabase
      .from('api_schema_mappings')
      .select('*')
      .eq('endpoint_id', endpointId)
      .eq('user_id', user.id)
      .single();

    if (mappingError || !schemaMapping) {
      console.error('Error fetching schema mapping:', mappingError);
      return new Response(
        JSON.stringify({ error: 'Schema mapping not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data for insertion
    const dataArray = Array.isArray(newData) ? newData : [newData];
    const columnMappings = schemaMapping.column_mappings as Array<{ name: string; originalName?: string }>;
    
    console.log('Processing', dataArray.length, 'records');

    const recordsToInsert = dataArray.map((item: any) => {
      const record: any = {
        user_id: user.id,
        source_endpoint_id: endpointId,
      };

      // Map API fields to database columns
      columnMappings.forEach((col: any) => {
        const apiFieldName = col.originalName || col.name;
        if (item[apiFieldName] !== undefined) {
          record[col.name] = item[apiFieldName];
        }
      });

      return record;
    });

    console.log('Inserting records:', JSON.stringify(recordsToInsert, null, 2));

    // Insert the data into the table
    const { data: insertedData, error: insertError } = await supabase
      .from(tableName)
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting data:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert data', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the last_synced_at timestamp
    const { error: updateError } = await supabase
      .from('api_schema_mappings')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', schemaMapping.id);

    if (updateError) {
      console.warn('Warning: Failed to update last_synced_at:', updateError);
    }

    console.log('Successfully inserted', insertedData?.length || 0, 'records');

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsInserted: insertedData?.length || 0,
        message: 'Data synced successfully!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-schema-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
