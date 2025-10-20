import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const AISettings = () => {
  const [provider, setProvider] = useState<'lovable' | 'openai'>('lovable');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-ai-settings', {
        method: 'GET'
      });

      if (error) throw error;

      if (data) {
        setProvider(data.provider || 'lovable');
        setOpenaiApiKey(data.openai_api_key || '');
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (provider === 'openai' && !openaiApiKey) {
        toast({
          title: "Error",
          description: "OpenAI API key is required when using OpenAI",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-ai-settings', {
        method: 'POST',
        body: {
          provider,
          openai_api_key: provider === 'openai' ? openaiApiKey : null,
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `AI provider set to ${provider === 'lovable' ? 'Lovable AI' : 'OpenAI'}`,
      });
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save AI settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider Settings</CardTitle>
        <CardDescription>
          Choose which AI provider to use for chat and tool generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>AI Provider</Label>
          <RadioGroup value={provider} onValueChange={(value) => setProvider(value as 'lovable' | 'openai')}>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="lovable" id="lovable" />
              <div className="space-y-1">
                <Label htmlFor="lovable" className="font-medium">
                  Lovable AI (Default)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Uses Google Gemini 2.5 Flash. No API key required. Includes free monthly usage.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="openai" id="openai" />
              <div className="space-y-1">
                <Label htmlFor="openai" className="font-medium">
                  OpenAI
                </Label>
                <p className="text-sm text-muted-foreground">
                  Uses GPT-5. Requires your own OpenAI API key. You'll be charged by OpenAI directly.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {provider === 'openai' && (
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your API key is encrypted and securely stored. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Dashboard
              </a>
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
