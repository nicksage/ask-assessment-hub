import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiEndpoint } from './EndpointManager';
import { DynamicDataTable } from './DynamicDataTable';

interface ApiTesterProps {
  endpoint: ApiEndpoint;
  onClose: () => void;
}

export function ApiTester({ endpoint, onClose }: ApiTesterProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendRequest = async () => {
    const config = localStorage.getItem('api_config');
    if (!config) {
      toast({
        title: "Configuration missing",
        description: "Please configure your API settings first",
        variant: "destructive",
      });
      return;
    }

    const { baseUrl, bearerToken } = JSON.parse(config);

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = `${baseUrl}${endpoint.path}`;
      const res = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
      toast({
        title: "Request successful",
        description: `${endpoint.method} ${endpoint.path}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: "Request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Tester: {endpoint.name}</CardTitle>
            <CardDescription>
              <span className="font-mono bg-muted px-1 rounded">{endpoint.method}</span>{' '}
              {endpoint.path}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSendRequest} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Request...
            </>
          ) : (
            'Send Request'
          )}
        </Button>

        {error && (
          <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            <DynamicDataTable data={response} endpoint={endpoint} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
