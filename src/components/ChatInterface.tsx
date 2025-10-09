import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '@/types/assessment';
import { OpenAIService } from '@/services/openaiService';
import { DataTable } from './DataTable';
import { AssessmentChart } from './AssessmentChart';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  apiKey: string;
}

export function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const openaiService = new OpenAIService(apiKey);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await openaiService.chat([...messages, userMessage]);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        data: response.data
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-card p-4">
        <h1 className="text-2xl font-bold">AI Assistant Hub</h1>
        <p className="text-sm text-muted-foreground">Ask about assessment results</p>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 && (
            <Card className="p-6 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Try asking: "Show me results for assessment A-104"
              </p>
            </Card>
          )}

          {messages.map((message, idx) => (
            <div key={idx} className="space-y-4">
              <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <Card className={`max-w-2xl p-4 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </Card>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>

              {message.data && (
                <div className="space-y-4">
                  <DataTable data={message.data} />
                  <AssessmentChart data={message.data} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-5 w-5 animate-pulse text-primary-foreground" />
              </div>
              <Card className="p-4">
                <p className="text-muted-foreground">Thinking...</p>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about assessment results..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
