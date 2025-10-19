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

    const { category_name, limit = 100 } = await req.json();
    console.log(`Getting risks by category: ${category_name}`);

    // Lookup risk category (case-insensitive)
    const { data: riskCategory, error: categoryError } = await supabase
      .from('risk_categories')
      .select('id, name, key')
      .eq('user_id', user.id)
      .ilike('name', category_name)
      .maybeSingle();

    if (categoryError) {
      console.error('Error fetching risk category:', categoryError);
      throw categoryError;
    }

    if (!riskCategory) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Risk category "${category_name}" not found`,
          count: 0,
          data: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found risk category:`, riskCategory);

    // Query risks in this category
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .eq('user_id', user.id)
      .eq('risk_category_id', riskCategory.id)
      .limit(limit);

    if (risksError) {
      console.error('Error fetching risks:', risksError);
      throw risksError;
    }

    console.log(`Found ${risks?.length || 0} risks`);

    return new Response(
      JSON.stringify({
        success: true,
        risk_category: riskCategory.name,
        risk_category_id: riskCategory.id,
        count: risks?.length || 0,
        data: risks || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-risks-by-category:', error);
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
