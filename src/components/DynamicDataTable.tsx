import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { ApiEndpoint } from './EndpointManager';
import { analyzeSchema, SchemaAnalysis } from '@/utils/schemaAnalyzer';
import { useSchemaMapping } from '@/hooks/useSchemaMapping';
import { AddSchemaDialog } from './AddSchemaDialog';

interface DynamicDataTableProps {
  data: any;
  endpoint: ApiEndpoint;
}

export function DynamicDataTable({ data, endpoint }: DynamicDataTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzedSchema, setAnalyzedSchema] = useState<SchemaAnalysis | null>(null);
  const { createSchema, isCreating } = useSchemaMapping();

  const handleAddToSchema = () => {
    const schema = analyzeSchema(data, endpoint.name);
    setAnalyzedSchema(schema);
    setDialogOpen(true);
  };

  const handleConfirmSchema = async (tableName: string, selectedColumns: any[]) => {
    if (!analyzedSchema) return;
    
    const result = await createSchema(
      tableName,
      selectedColumns,
      endpoint.id
    );
    
    if (result.success) {
      setDialogOpen(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
        <Button size="sm" onClick={handleAddToSchema} disabled={isCreating} className="w-1/4">
          <Database className="mr-2 h-4 w-4" />
          Add to Schema
        </Button>
      </CardContent>

      <AddSchemaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schema={analyzedSchema}
        onConfirm={handleConfirmSchema}
        isCreating={isCreating}
      />
    </Card>
  );
}
