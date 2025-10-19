import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ColumnDefinition } from '@/utils/schemaAnalyzer';

export function useSchemaMapping() {
  const [isCreating, setIsCreating] = useState(false);

  const createSchema = async (
    tableName: string,
    columns: ColumnDefinition[],
    endpointId: string
  ) => {
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-schema-from-api', {
        body: {
          tableName,
          columns: columns.map(col => ({
            name: col.name,
            type: col.type,
          })),
          endpointId,
        },
      });

      if (error) {
        console.error('Error creating schema:', error);
        toast.error('Failed to create schema', {
          description: error.message,
        });
        return { success: false, error };
      }

      if (data?.error) {
        toast.error('Failed to create schema', {
          description: data.error,
        });
        return { success: false, error: data.error };
      }

      toast.success('Schema created successfully!', {
        description: `Table "${data.table_name}" has been created.`,
      });

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Exception creating schema:', err);
      toast.error('Failed to create schema', {
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createSchema,
    isCreating,
  };
}
