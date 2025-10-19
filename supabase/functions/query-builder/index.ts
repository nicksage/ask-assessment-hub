import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryRequest {
  table: string
  select?: string[]
  filters?: Array<{
    column: string
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
    value: any
  }>
  sort?: {
    column: string
    direction: 'asc' | 'desc'
  }
  limit?: number
  offset?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const queryRequest: QueryRequest = await req.json()
    
    console.log('Query builder request:', JSON.stringify(queryRequest, null, 2))

    // Validate table name (alphanumeric and underscores only)
    if (!/^[a-z_][a-z0-9_]*$/.test(queryRequest.table)) {
      throw new Error('Invalid table name')
    }

    // Build the query
    let query = supabaseClient
      .from(queryRequest.table)
      .select(queryRequest.select?.join(',') || '*')
      .eq('user_id', user.id)

    // Apply filters
    if (queryRequest.filters) {
      for (const filter of queryRequest.filters) {
        // Validate column name
        if (!/^[a-z_][a-z0-9_]*$/.test(filter.column)) {
          throw new Error(`Invalid column name: ${filter.column}`)
        }

        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.column, filter.value)
            break
          case 'not_equals':
            query = query.neq(filter.column, filter.value)
            break
          case 'contains':
            query = query.ilike(filter.column, `%${filter.value}%`)
            break
          case 'gt':
            query = query.gt(filter.column, filter.value)
            break
          case 'gte':
            query = query.gte(filter.column, filter.value)
            break
          case 'lt':
            query = query.lt(filter.column, filter.value)
            break
          case 'lte':
            query = query.lte(filter.column, filter.value)
            break
          case 'in':
            query = query.in(filter.column, filter.value)
            break
          default:
            throw new Error(`Unsupported operator: ${filter.operator}`)
        }
      }
    }

    // Apply sorting
    if (queryRequest.sort) {
      if (!/^[a-z_][a-z0-9_]*$/.test(queryRequest.sort.column)) {
        throw new Error(`Invalid sort column: ${queryRequest.sort.column}`)
      }
      query = query.order(queryRequest.sort.column, { 
        ascending: queryRequest.sort.direction === 'asc' 
      })
    }

    // Apply pagination
    if (queryRequest.limit) {
      query = query.limit(queryRequest.limit)
    }
    if (queryRequest.offset) {
      query = query.range(
        queryRequest.offset, 
        queryRequest.offset + (queryRequest.limit || 100) - 1
      )
    }

    const { data, error, count } = await query

    if (error) throw error

    console.log(`Query executed successfully. Returned ${data?.length || 0} records`)

    return new Response(
      JSON.stringify({
        success: true,
        data,
        count: data?.length || 0,
        query: {
          table: queryRequest.table,
          filters: queryRequest.filters?.length || 0,
          sorted: !!queryRequest.sort
        }
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Query builder error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
