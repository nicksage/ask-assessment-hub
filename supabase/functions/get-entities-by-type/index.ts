import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { type_name, limit = 100 } = await req.json();
    console.log(`Getting entities by type: ${type_name}`);

    // Lookup entity type (case-insensitive)
    const { data: entityType, error: typeError } = await supabase
      .from('entity_types')
      .select('id, name, key')
      .eq('user_id', user.id)
      .ilike('name', type_name)
      .maybeSingle();

    if (typeError) {
      console.error('Error fetching entity type:', typeError);
      throw typeError;
    }

    if (!entityType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Entity type "${type_name}" not found`,
          count: 0,
          data: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found entity type:`, entityType);

    // Query entities of this type
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', user.id)
      .eq('auditable_entity_type_id', entityType.id)
      .limit(limit);

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      throw entitiesError;
    }

    console.log(`Found ${entities?.length || 0} entities`);

    return new Response(
      JSON.stringify({
        success: true,
        entity_type: entityType.name,
        entity_type_id: entityType.id,
        count: entities?.length || 0,
        data: entities || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-entities-by-type:', error);
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
