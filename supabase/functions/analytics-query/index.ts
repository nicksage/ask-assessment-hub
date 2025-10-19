import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  table: string
  aggregation: {
    type: 'count' | 'avg' | 'sum' | 'min' | 'max'
    column: string
    groupBy?: string
  }
  filters?: Array<{
    column: string
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
    value: any
  }>
  dateRange?: {
    column: string
    start?: string
    end?: string
  }
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

    const analyticsRequest: AnalyticsRequest = await req.json()
    
    console.log('Analytics query request:', JSON.stringify(analyticsRequest, null, 2))

    // Validate table name
    if (!/^[a-z_][a-z0-9_]*$/.test(analyticsRequest.table)) {
      throw new Error('Invalid table name')
    }

    // Validate column names
    if (!/^[a-z_][a-z0-9_]*$/.test(analyticsRequest.aggregation.column)) {
      throw new Error('Invalid aggregation column')
    }
    if (analyticsRequest.aggregation.groupBy && 
        !/^[a-z_][a-z0-9_]*$/.test(analyticsRequest.aggregation.groupBy)) {
      throw new Error('Invalid groupBy column')
    }

    // Build base query with user filtering
    let query = supabaseClient
      .from(analyticsRequest.table)
      .select('*')
      .eq('user_id', user.id)

    // Apply filters
    if (analyticsRequest.filters) {
      for (const filter of analyticsRequest.filters) {
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
        }
      }
    }

    // Apply date range filtering
    if (analyticsRequest.dateRange) {
      if (!/^[a-z_][a-z0-9_]*$/.test(analyticsRequest.dateRange.column)) {
        throw new Error('Invalid date range column')
      }
      if (analyticsRequest.dateRange.start) {
        query = query.gte(analyticsRequest.dateRange.column, analyticsRequest.dateRange.start)
      }
      if (analyticsRequest.dateRange.end) {
        query = query.lte(analyticsRequest.dateRange.column, analyticsRequest.dateRange.end)
      }
    }

    // Fetch data
    const { data, error } = await query

    if (error) throw error

    // Perform aggregation in memory
    let results: any[] = []

    if (analyticsRequest.aggregation.groupBy) {
      // Group by and aggregate
      const groups = new Map<string, number[]>()
      
      for (const row of data || []) {
        const groupKey = String(row[analyticsRequest.aggregation.groupBy] || 'null')
        const value = parseFloat(row[analyticsRequest.aggregation.column]) || 0
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(value)
      }

      // Calculate aggregations
      for (const [groupKey, values] of groups) {
        let aggregatedValue: number

        switch (analyticsRequest.aggregation.type) {
          case 'count':
            aggregatedValue = values.length
            break
          case 'sum':
            aggregatedValue = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length
            break
          case 'min':
            aggregatedValue = Math.min(...values)
            break
          case 'max':
            aggregatedValue = Math.max(...values)
            break
          default:
            aggregatedValue = values.length
        }

        results.push({
          [analyticsRequest.aggregation.groupBy!]: groupKey,
          [analyticsRequest.aggregation.type]: aggregatedValue
        })
      }
    } else {
      // Single aggregation without grouping
      const values = (data || []).map(row => 
        parseFloat(row[analyticsRequest.aggregation.column]) || 0
      )

      let aggregatedValue: number

      switch (analyticsRequest.aggregation.type) {
        case 'count':
          aggregatedValue = data?.length || 0
          break
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0)
          break
        case 'avg':
          aggregatedValue = values.length > 0 
            ? values.reduce((a, b) => a + b, 0) / values.length 
            : 0
          break
        case 'min':
          aggregatedValue = values.length > 0 ? Math.min(...values) : 0
          break
        case 'max':
          aggregatedValue = values.length > 0 ? Math.max(...values) : 0
          break
        default:
          aggregatedValue = data?.length || 0
      }

      results = [{
        [analyticsRequest.aggregation.type]: aggregatedValue
      }]
    }

    console.log(`Analytics executed successfully. Returned ${results.length} result groups`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        aggregation: analyticsRequest.aggregation.type,
        groupedBy: analyticsRequest.aggregation.groupBy || null
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Analytics query error:', error)
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
