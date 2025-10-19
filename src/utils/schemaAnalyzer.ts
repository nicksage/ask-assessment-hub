// System-generated column names that won't conflict with API data
const RESERVED_COLUMNS = ['record_id', 'user_id', 'source_endpoint_id', 'synced_at', 'record_updated_at'];

export interface ColumnDefinition {
  name: string;
  type: string;
  originalName: string;
}

export interface SchemaAnalysis {
  tableName: string;
  columns: ColumnDefinition[];
  isArray: boolean;
  sampleData: any;
}

// Infer PostgreSQL type from JavaScript value
function inferPostgresType(value: any): string {
  if (value === null || value === undefined) return 'text';
  
  if (typeof value === 'boolean') return 'boolean';
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'bigint' : 'numeric';
  }
  
  if (typeof value === 'string') {
    // Check if it's a date
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value) && !isNaN(Date.parse(value))) {
      return 'timestamptz';
    }
    
    // Check if it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) {
      return 'uuid';
    }
    
    return 'text';
  }
  
  if (typeof value === 'object') return 'jsonb';
  
  return 'text';
}

// Generate sanitized table name
function generateTableName(endpointName: string): string {
  return endpointName
    .toLowerCase()
    .replace(/^(get|post|put|delete|patch)\s+/i, '') // Remove HTTP verbs
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '') // Trim underscores
    .substring(0, 50); // Limit length
}

// Analyze API response structure
export function analyzeSchema(data: any, endpointName: string): SchemaAnalysis {
  const tableName = generateTableName(endpointName);
  const columns: ColumnDefinition[] = [];
  
  let sampleObject: any;
  let isArray = false;
  
  if (Array.isArray(data)) {
    isArray = true;
    sampleObject = data[0] || {};
  } else if (typeof data === 'object' && data !== null) {
    // Check if data has an array property (like { assessments: [...] })
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
    if (arrayKey && Array.isArray(data[arrayKey]) && data[arrayKey].length > 0) {
      isArray = true;
      sampleObject = data[arrayKey][0];
    } else {
      sampleObject = data;
    }
  } else {
    sampleObject = {};
  }
  
  // Extract columns from sample object
  Object.entries(sampleObject).forEach(([key, value]) => {
    // Skip internal fields
    if (key.startsWith('_')) return;
    
    const sanitizedName = key
      .replace(/[^a-z0-9_]/gi, '_')
      .toLowerCase();
    
    // No need to check for reserved columns anymore - system columns are renamed
    columns.push({
      name: sanitizedName,
      type: inferPostgresType(value),
      originalName: key,
    });
  });
  
  return {
    tableName,
    columns,
    isArray,
    sampleData: isArray ? data : [data],
  };
}
