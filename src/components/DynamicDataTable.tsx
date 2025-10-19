import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from 'lucide-react';
import { ApiEndpoint } from './EndpointManager';

interface DynamicDataTableProps {
  data: any;
  endpoint: ApiEndpoint;
}

export function DynamicDataTable({ data, endpoint }: DynamicDataTableProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');

  const renderTable = (obj: any) => {
    if (Array.isArray(obj) && obj.length > 0) {
      const keys = Object.keys(obj[0]);
      return (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {keys.map((key) => (
                  <TableHead key={key} className="font-semibold">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {obj.map((row: any, idx: number) => (
                <TableRow key={idx}>
                  {keys.map((key) => (
                    <TableCell key={key}>
                      {typeof row[key] === 'object' && row[key] !== null
                        ? JSON.stringify(row[key], null, 2)
                        : String(row[key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    } else if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj);
      return (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Key</TableHead>
                <TableHead className="font-semibold">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell>
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value, null, 2)
                      : String(value ?? '')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">Cannot render data in table format</p>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Response Data</CardTitle>
          <Button size="sm" variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Add to Schema
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            {renderTable(data)}
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
