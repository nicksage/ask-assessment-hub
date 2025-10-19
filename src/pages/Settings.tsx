import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EndpointManager } from '@/components/EndpointManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
interface ApiConfig {
  id?: string;
  name: string;
  baseUrl: string;
  bearerToken: string;
}
const Settings = () => {
  const [config, setConfig] = useState<ApiConfig>({
    name: 'Default',
    baseUrl: '',
    bearerToken: ''
  });
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const isApiConfig = location.pathname === '/settings/api-config';
  const isEndpoints = location.pathname === '/settings/endpoints';
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (!user) return;
    const loadConfig = async () => {
      // Try to migrate localStorage data first
      const stored = localStorage.getItem('api_config');
      if (stored) {
        const localConfig = JSON.parse(stored);
        const {
          data: existing
        } = await supabase.from('api_configurations').select('*').eq('user_id', user.id).eq('name', 'Default').single();
        if (!existing) {
          await supabase.from('api_configurations').insert({
            user_id: user.id,
            name: 'Default',
            base_url: localConfig.baseUrl,
            bearer_token: localConfig.bearerToken
          });
          localStorage.removeItem('api_config');
        }
      }

      // Load from database
      const {
        data,
        error
      } = await supabase.from('api_configurations').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }
      if (data) {
        setConfig({
          id: data.id,
          name: data.name,
          baseUrl: data.base_url,
          bearerToken: data.bearer_token
        });
        setConfigId(data.id);
      }
    };
    loadConfig();
  }, [user]);
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (configId) {
        const {
          error
        } = await supabase.from('api_configurations').update({
          base_url: config.baseUrl,
          bearer_token: config.bearerToken
        }).eq('id', configId);
        if (error) throw error;
      } else {
        const {
          data,
          error
        } = await supabase.from('api_configurations').insert({
          user_id: user.id,
          name: config.name,
          base_url: config.baseUrl,
          bearer_token: config.bearerToken
        }).select().single();
        if (error) throw error;
        setConfigId(data.id);
      }
      toast({
        title: "Settings saved",
        description: "API configuration has been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }
  return <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
          
        </div>

        {isApiConfig && <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your API base URL and authentication token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input id="baseUrl" placeholder="https://api.example.com" value={config.baseUrl} onChange={e => setConfig({
              ...config,
              baseUrl: e.target.value
            })} />
                <p className="text-xs text-muted-foreground">
                  The base URL for your API endpoints
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bearerToken">Bearer Token</Label>
                <Input id="bearerToken" type="password" placeholder="Your API token" value={config.bearerToken} onChange={e => setConfig({
              ...config,
              bearerToken: e.target.value
            })} />
                <p className="text-xs text-muted-foreground">
                  Your authentication token (stored locally)
                </p>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>}

        {isEndpoints && <EndpointManager configId={configId} />}
      </div>
    </div>;
};
export default Settings;