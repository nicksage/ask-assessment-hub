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

    const { entity_type_name, limit = 100 } = await req.json();
    console.log(`Getting entities with risks - type filter: ${entity_type_name || 'all'}`);

    let entityTypeId = null;

    // If entity_type_name is provided, look it up
    if (entity_type_name) {
      const { data: entityType, error: typeError } = await supabase
        .from('entity_types')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', entity_type_name)
        .maybeSingle();

      if (typeError) {
        console.error('Error fetching entity type:', typeError);
        throw typeError;
      }

      if (entityType) {
        entityTypeId = entityType.id;
        console.log(`Found entity type:`, entityType);
      }
    }

    // Get entities
    let entitiesQuery = supabase
      .from('entities')
      .select('*')
      .eq('user_id', user.id);

    if (entityTypeId) {
      entitiesQuery = entitiesQuery.eq('auditable_entity_type_id', entityTypeId);
    }

    entitiesQuery = entitiesQuery.limit(limit);

    const { data: entities, error: entitiesError } = await entitiesQuery;

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      throw entitiesError;
    }

    console.log(`Found ${entities?.length || 0} entities`);

    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          data: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get entity IDs
    const entityIds = entities.map(e => e.id);

    // Get entity_risks relationships
    const { data: entityRisks, error: entityRisksError } = await supabase
      .from('entity_risks')
      .select('*')
      .eq('user_id', user.id)
      .in('entity_id', entityIds);

    if (entityRisksError) {
      console.error('Error fetching entity_risks:', entityRisksError);
      throw entityRisksError;
    }

    console.log(`Found ${entityRisks?.length || 0} entity-risk relationships`);

    // Get risk IDs from entity_risks
    const riskIds = [...new Set(entityRisks?.map(er => er.risk_id).filter(Boolean) || [])];

    let risks: any[] = [];
    if (riskIds.length > 0) {
      const { data: risksData, error: risksError } = await supabase
        .from('risks')
        .select('*')
        .eq('user_id', user.id)
        .in('id', riskIds);

      if (risksError) {
        console.error('Error fetching risks:', risksError);
        throw risksError;
      }

      risks = risksData || [];
      console.log(`Found ${risks.length} risks`);
    }

    // Build enriched entity data with associated risks
    const enrichedEntities = entities.map(entity => {
      const entityRiskLinks = entityRisks?.filter(er => er.entity_id === entity.id) || [];
      const associatedRisks = entityRiskLinks.map(er => {
        const risk = risks.find(r => r.id === er.risk_id);
        return {
          entity_risk_id: er.id,
          entity_risk_status: er.status,
          risk: risk || null
        };
      }).filter(r => r.risk !== null);

      return {
        ...entity,
        associated_risks: associatedRisks,
        risk_count: associatedRisks.length
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        entity_type_filter: entity_type_name || 'all',
        count: enrichedEntities.length,
        total_risks: risks.length,
        data: enrichedEntities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-entities-with-risks:', error);
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
