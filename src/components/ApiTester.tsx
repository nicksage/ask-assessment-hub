import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiEndpoint } from './EndpointManager';
import { DynamicDataTable } from './DynamicDataTable';
import { supabase } from '@/integrations/supabase/client';

interface ApiTesterProps {
  endpoint: ApiEndpoint;
  configId: string | null;
}

export function ApiTester({ endpoint, configId }: ApiTesterProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ base_url: string; bearer_token: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      if (!configId) return;
      
      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('id', configId)
        .single();

      if (error) {
        console.error('Error loading config:', error);
        return;
      }

      setConfig(data);
    };

    loadConfig();
  }, [configId]);

  const handleSendRequest = async () => {
    if (!config) {
      toast({
        title: "Configuration missing",
        description: "Please configure your API settings first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = `${config.base_url}${endpoint.path}`;
      
      console.log('Sending request through proxy:', { url, method: endpoint.method });

      const { data, error: proxyError } = await supabase.functions.invoke('proxy-api-request', {
        body: {
          url,
          method: endpoint.method,
          bearerToken: config.bearer_token,
        },
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }

      console.log('Proxy response:', data);

      if (data.status >= 400) {
        setError(`HTTP ${data.status}: ${data.statusText}`);
        setResponse(data.data);
        toast({
          title: "Request failed",
          description: `${endpoint.method} ${endpoint.path} - ${data.status}`,
          variant: "destructive",
        });
      } else {
        setResponse(data.data);
        toast({
          title: "Request successful",
          description: `${endpoint.method} ${endpoint.path}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Request error:', err);
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
        <CardTitle>{endpoint.name}</CardTitle>
        <CardDescription>
          <span className="font-mono bg-muted px-1 rounded">{endpoint.method}</span>{' '}
          {endpoint.path}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSendRequest} disabled={loading} className="w-1/4">
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
