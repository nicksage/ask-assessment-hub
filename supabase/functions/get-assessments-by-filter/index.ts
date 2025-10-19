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

    const { type_filter, period_name, limit = 100 } = await req.json();
    console.log(`Getting assessments - type: ${type_filter}, period: ${period_name}`);

    let assessmentPeriodId = null;

    // If period_name is provided, look it up
    if (period_name) {
      const { data: period, error: periodError } = await supabase
        .from('assessment_periods')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', `%${period_name}%`)
        .maybeSingle();

      if (periodError) {
        console.error('Error fetching assessment period:', periodError);
        throw periodError;
      }

      if (period) {
        assessmentPeriodId = period.id;
        console.log(`Found assessment period:`, period);
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Assessment period "${period_name}" not found`,
            count: 0,
            data: []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build query dynamically based on filters
    let query = supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id);

    if (type_filter) {
      query = query.eq('type', type_filter);
    }

    if (assessmentPeriodId) {
      query = query.eq('assessment_period_id', assessmentPeriodId.toString());
    }

    query = query.limit(limit);

    const { data: assessments, error: assessmentsError } = await query;

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
      throw assessmentsError;
    }

    console.log(`Found ${assessments?.length || 0} assessments`);

    return new Response(
      JSON.stringify({
        success: true,
        filters_applied: {
          type: type_filter || 'all',
          period: period_name || 'all',
          period_id: assessmentPeriodId
        },
        count: assessments?.length || 0,
        data: assessments || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-assessments-by-filter:', error);
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
