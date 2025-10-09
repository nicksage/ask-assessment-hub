import { useState, useEffect } from 'react';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ChatInterface } from '@/components/ChatInterface';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('openai_api_key');
    if (stored) setApiKey(stored);
  }, []);

  if (!apiKey) {
    return (
      <>
        <ApiKeyInput onApiKeySet={setApiKey} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <ChatInterface apiKey={apiKey} />
      <Toaster />
    </>
  );
};

export default Index;
