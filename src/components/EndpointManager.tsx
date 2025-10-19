import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiTester } from './ApiTester';

export interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
}

export function EndpointManager() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [newEndpoint, setNewEndpoint] = useState<Omit<ApiEndpoint, 'id'>>({
    name: '',
    method: 'GET',
    path: '',
  });
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('api_endpoints');
    if (stored) {
      setEndpoints(JSON.parse(stored));
    }
  }, []);

  const saveEndpoints = (updated: ApiEndpoint[]) => {
    localStorage.setItem('api_endpoints', JSON.stringify(updated));
    setEndpoints(updated);
  };

  const handleAdd = () => {
    if (!newEndpoint.name || !newEndpoint.path) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const endpoint: ApiEndpoint = {
      ...newEndpoint,
      id: crypto.randomUUID(),
    };

    saveEndpoints([...endpoints, endpoint]);
    setNewEndpoint({ name: '', method: 'GET', path: '' });
    toast({
      title: "Endpoint added",
      description: `${endpoint.name} has been added successfully.`,
    });
  };

  const handleDelete = (id: string) => {
    saveEndpoints(endpoints.filter((e) => e.id !== id));
    if (selectedEndpoint?.id === id) {
      setSelectedEndpoint(null);
    }
    toast({
      title: "Endpoint deleted",
      description: "The endpoint has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Endpoint</CardTitle>
          <CardDescription>Define API endpoints to test and analyze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Get Assessments"
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={newEndpoint.method}
                onValueChange={(value: any) => setNewEndpoint({ ...newEndpoint, method: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                placeholder="/assessments"
                value={newEndpoint.path}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, path: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleAdd} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Endpoint
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Endpoints</CardTitle>
          <CardDescription>Click "Test" to send a request and analyze the response</CardDescription>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No endpoints added yet. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{endpoint.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-mono bg-muted px-1 rounded">{endpoint.method}</span>{' '}
                      {endpoint.path}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(endpoint.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEndpoint && (
        <ApiTester
          endpoint={selectedEndpoint}
          onClose={() => setSelectedEndpoint(null)}
        />
      )}
    </div>
  );
}
