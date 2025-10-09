import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Key } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
}

export function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      onApiKeySet(apiKey.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold">AI Assistant Hub</h1>
          <p className="text-sm text-muted-foreground">
            Enter your OpenAI API key to get started
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={!apiKey.trim()}>
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
