import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SchemaAnalysis } from '@/utils/schemaAnalyzer';
import { Loader2, AlertCircle } from 'lucide-react';

const RESERVED_COLUMNS = ['id', 'user_id', 'source_endpoint_id', 'created_at', 'updated_at'];

interface AddSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: SchemaAnalysis | null;
  onConfirm: (tableName: string, selectedColumns: any[]) => void;
  isCreating: boolean;
}

export function AddSchemaDialog({
  open,
  onOpenChange,
  schema,
  onConfirm,
  isCreating,
}: AddSchemaDialogProps) {
  const [tableName, setTableName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());

  // Update table name and select all columns when schema changes
  useEffect(() => {
    if (schema) {
      setTableName(schema.tableName);
      // Select all columns by default
      setSelectedColumns(new Set(schema.columns.map((_, idx) => idx)));
    }
  }, [schema]);

  const toggleColumn = (index: number) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (!schema) return;
    const selected = schema.columns.filter((_, idx) => selectedColumns.has(idx));
    onConfirm(tableName, selected);
  };

  if (!schema) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Database Schema</DialogTitle>
          <DialogDescription>
            Review the proposed table structure generated from your API response.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Columns ({selectedColumns.size} of {schema.columns.length} selected)</Label>
            <ScrollArea className="h-64 mt-2 border rounded-lg p-4">
              <div className="space-y-2">
                {schema.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <Checkbox
                        checked={selectedColumns.has(idx)}
                        onCheckedChange={() => toggleColumn(idx)}
                      />
                      <code className="text-sm font-mono">{col.name}</code>
                      {col.name.startsWith('api_') && RESERVED_COLUMNS.includes(col.name.substring(4)) && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Renamed
                        </Badge>
                      )}
                      {col.originalName !== col.name && (
                        <span className="text-xs text-muted-foreground">
                          (from: {col.originalName})
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary">{col.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Additional columns:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><code>id</code> (uuid, primary key)</li>
              <li><code>user_id</code> (uuid, for row-level security)</li>
              <li><code>source_endpoint_id</code> (uuid, tracks data source)</li>
              <li><code>created_at</code>, <code>updated_at</code> (timestamps)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCreating || !tableName.trim() || selectedColumns.size === 0}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
