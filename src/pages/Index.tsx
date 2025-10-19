import { useState, useEffect } from 'react';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ChatInterface } from '@/components/ChatInterface';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background z-50">
            <DropdownMenuItem onClick={() => navigate('/settings/api-config')}>
              API Configuration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/endpoints')}>
              Endpoints
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChatInterface apiKey={apiKey} />
      </div>
      <Toaster />
    </>
  );
};

export default Index;
