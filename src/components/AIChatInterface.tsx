import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { GenericDataTable } from './GenericDataTable';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'lovable' | 'openai'>('lovable');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load AI provider setting
    const loadAiProvider = async () => {
      try {
        const { data } = await supabase.functions.invoke('manage-ai-settings', {
          method: 'GET'
        });
        if (data?.provider) {
          setAiProvider(data.provider);
        }
      } catch (error) {
        console.error('Error loading AI provider:', error);
      }
    };
    loadAiProvider();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isTableData = (data: any): boolean => {
    if (!Array.isArray(data) || data.length === 0) return false;
    if (typeof data[0] !== 'object') return false;
    return true;
  };

  const extractTableData = (data: any): any[] | null => {
    if (Array.isArray(data)) return data;
    
    if (typeof data === 'object' && data !== null) {
      const possibleKeys = ['data', 'results', 'items', 'records', 'rows'];
      for (const key of possibleKeys) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          return data[key];
        }
      }
      const arrayKeys = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0);
      if (arrayKeys.length === 1) return data[arrayKeys[0]];
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-query', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        data: data.data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    "Show me all assessments",
    "How many entities do I have?",
    "What are the recent risks?",
    "Summarize my assessment data"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <Card className="flex-1 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {aiProvider === 'lovable' ? 'Lovable AI (Gemini)' : 'OpenAI (GPT-5)'}
          </Badge>
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Bot className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Start a conversation by asking about your data
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                {suggestedQueries.map((query, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => setInput(query)}
                    className="text-left justify-start"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <Card
                      className={`p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </Card>
                    {msg.data && (
                      <div className="space-y-4 w-full mt-2">
                        {Array.isArray(msg.data) ? (
                          msg.data.map((result, idx) => {
                            const tableData = extractTableData(result);
                            if (tableData && isTableData(tableData)) {
                              return <GenericDataTable key={idx} data={tableData} title={msg.data.length > 1 ? `Result ${idx + 1}` : undefined} />;
                            } else {
                              return (
                                <Card key={idx} className="p-3 bg-background">
                                  <div className="text-sm font-mono max-h-96 overflow-auto">
                                    <pre className="whitespace-pre-wrap">
                                      {JSON.stringify(result, null, 2)}
                                    </pre>
                                  </div>
                                </Card>
                              );
                            }
                          })
                        ) : (
                          (() => {
                            const tableData = extractTableData(msg.data);
                            if (tableData && isTableData(tableData)) {
                              return <GenericDataTable data={tableData} />;
                            } else {
                              return (
                                <Card className="p-3 bg-background">
                                  <div className="text-sm font-mono max-h-96 overflow-auto">
                                    <pre className="whitespace-pre-wrap">
                                      {JSON.stringify(msg.data, null, 2)}
                                    </pre>
                                  </div>
                                </Card>
                              );
                            }
                          })()
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <Card className="p-3 bg-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your data..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
