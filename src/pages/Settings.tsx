import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EndpointManager } from '@/components/EndpointManager';

interface ApiConfig {
  baseUrl: string;
  bearerToken: string;
}

const Settings = () => {
  const [config, setConfig] = useState<ApiConfig>({ baseUrl: '', bearerToken: '' });
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isApiConfig = location.pathname === '/settings/api-config';
  const isEndpoints = location.pathname === '/settings/endpoints';

  useEffect(() => {
    const stored = localStorage.getItem('api_config');
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('api_config', JSON.stringify(config));
    toast({
      title: "Settings saved",
      description: "API configuration has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            <h1 className="text-3xl font-bold">
              {isApiConfig ? 'API Configuration' : 'Endpoints'}
            </h1>
          </div>
        </div>

        {isApiConfig && (
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your API base URL and authentication token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.example.com"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for your API endpoints
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bearerToken">Bearer Token</Label>
                <Input
                  id="bearerToken"
                  type="password"
                  placeholder="Your API token"
                  value={config.bearerToken}
                  onChange={(e) => setConfig({ ...config, bearerToken: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Your authentication token (stored locally)
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        )}

        {isEndpoints && <EndpointManager />}
      </div>
    </div>
  );
};

export default Settings;
