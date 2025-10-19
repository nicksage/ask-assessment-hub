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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Getting schema registry...');

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Get all schema mappings for this user
    const { data: mappings, error: mappingsError } = await supabaseClient
      .from('api_schema_mappings')
      .select(`
        table_name,
        column_mappings,
        last_synced_at,
        endpoint_id,
        api_endpoints (
          name,
          method,
          path
        )
      `)
      .eq('user_id', user.id);

    if (mappingsError) {
      console.error('Mappings error:', mappingsError);
      throw mappingsError;
    }

    console.log(`Found ${mappings?.length || 0} schema mappings`);

    // Build schema registry
    const registry = {
      generated_at: new Date().toISOString(),
      user_id: user.id,
      tables: await Promise.all(
        (mappings || []).map(async (mapping) => {
          console.log(`Processing table: ${mapping.table_name}`);

          // Categorize columns
          const systemColumns = ['record_id', 'user_id', 'source_endpoint_id', 'synced_at', 'record_updated_at'];
          const apiColumns = (mapping.column_mappings || []).map((col: any) => ({
            name: col.name,
            type: col.type,
            original_name: col.originalName || col.name,
            is_system: false,
          }));

          // Get record count
          const { count, error: countError } = await supabaseClient
            .from(mapping.table_name)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (countError) {
            console.error(`Count error for ${mapping.table_name}:`, countError);
          }

          console.log(`Table ${mapping.table_name} has ${count || 0} records`);

          return {
            table_name: mapping.table_name,
            endpoint: mapping.api_endpoints || { name: 'Unknown', method: 'GET', path: '' },
            last_synced: mapping.last_synced_at,
            record_count: count || 0,
            columns: {
              system: systemColumns.map((name) => ({
                name,
                type: getSystemColumnType(name),
                description: getSystemColumnDescription(name),
              })),
              api: apiColumns,
            },
            unique_constraint: '(user_id, source_endpoint_id, id)',
            sample_queries: generateSampleQueries(mapping.table_name, apiColumns),
          };
        })
      ),
      relationships: detectRelationships(mappings || []),
    };

    console.log('Schema registry generated successfully');

    return new Response(JSON.stringify(registry, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Schema registry error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemColumnType(columnName: string): string {
  const types: Record<string, string> = {
    record_id: 'uuid',
    user_id: 'uuid',
    source_endpoint_id: 'uuid',
    synced_at: 'timestamptz',
    record_updated_at: 'timestamptz',
  };
  return types[columnName] || 'unknown';
}

function getSystemColumnDescription(columnName: string): string {
  const descriptions: Record<string, string> = {
    record_id: 'Unique identifier for this record (UUID)',
    user_id: 'User who owns this record',
    source_endpoint_id: 'API endpoint this data came from',
    synced_at: 'When this record was first synced',
    record_updated_at: 'When this record was last updated',
  };
  return descriptions[columnName] || '';
}

function generateSampleQueries(tableName: string, columns: any[]): string[] {
  const queries = [
    `SELECT * FROM ${tableName} WHERE user_id = auth.uid() LIMIT 10`,
    `SELECT COUNT(*) FROM ${tableName} WHERE user_id = auth.uid()`,
  ];

  // Add queries for common column types
  const textColumns = columns.filter((c) => c.type === 'text').slice(0, 2);
  textColumns.forEach((col) => {
    queries.push(`SELECT * FROM ${tableName} WHERE user_id = auth.uid() AND ${col.name} ILIKE '%search%'`);
  });

  // Add date-based queries if available
  const dateColumns = columns.filter((c) => c.type === 'timestamp with time zone').slice(0, 1);
  dateColumns.forEach((col) => {
    queries.push(`SELECT * FROM ${tableName} WHERE user_id = auth.uid() ORDER BY ${col.name} DESC LIMIT 10`);
  });

  return queries;
}

interface Relationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  relationship_type: string;
  confidence: string;
}

function detectRelationships(mappings: any[]): Relationship[] {
  const relationships: Relationship[] = [];

  // Look for _id suffix columns that might reference other tables
  mappings.forEach((mapping) => {
    (mapping.column_mappings || []).forEach((col: any) => {
      if (col.name.endsWith('_id')) {
        const potentialTable = col.name.replace(/_id$/, '') + 's';
        const targetMapping = mappings.find((m) => m.table_name === potentialTable);

        if (targetMapping) {
          relationships.push({
            from_table: mapping.table_name,
            from_column: col.name,
            to_table: targetMapping.table_name,
            to_column: 'id',
            relationship_type: 'many_to_one',
            confidence: 'suggested',
          });
        }
      }
    });
  });

  return relationships;
}
