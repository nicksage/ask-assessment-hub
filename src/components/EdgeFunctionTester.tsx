import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, FileJson } from "lucide-react";

export const EdgeFunctionTester = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const [queryInput, setQueryInput] = useState(JSON.stringify({
    table: "assessments",
    select: ["id", "name", "status"],
    filters: [
      { column: "status", operator: "eq", value: "Complete" }
    ],
    sort: { column: "id", order: "asc" },
    limit: 10
  }, null, 2));
  const [queryResult, setQueryResult] = useState<any>(null);
  const [analyticsInput, setAnalyticsInput] = useState(JSON.stringify({
    table: "assessments",
    aggregation: {
      type: "count",
      column: "id",
      groupBy: "status"
    }
  }, null, 2));
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);

  const testSchemaRegistry = async () => {
    setLoading(true);
    setSchemaResult(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('get-schema-registry');
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;

      setSchemaResult({ success: true, data, duration });
      toast({
        title: "Schema Registry Test Successful",
        description: `Retrieved in ${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setSchemaResult({ success: false, error: error.message, duration });
      toast({
        variant: "destructive",
        title: "Schema Registry Test Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testQueryBuilder = async () => {
    setLoading(true);
    setQueryResult(null);
    const startTime = Date.now();

    try {
      const parsedQuery = JSON.parse(queryInput);
      const { data, error } = await supabase.functions.invoke('query-builder', {
        body: parsedQuery
      });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;

      setQueryResult({ success: true, data, duration });
      toast({
        title: "Query Builder Test Successful",
        description: `Retrieved ${data?.length || 0} records in ${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setQueryResult({ success: false, error: error.message, duration });
      toast({
        variant: "destructive",
        title: "Query Builder Test Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testAnalytics = async () => {
    setLoading(true);
    setAnalyticsResult(null);
    const startTime = Date.now();

    try {
      const parsedQuery = JSON.parse(analyticsInput);
      const { data, error } = await supabase.functions.invoke('analytics-query', {
        body: parsedQuery
      });
      
      const duration = Date.now() - startTime;
      
      if (error) throw error;

      setAnalyticsResult({ success: true, data, duration });
      toast({
        title: "Analytics Test Successful",
        description: `Retrieved ${data?.results?.length || 0} result groups in ${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setAnalyticsResult({ success: false, error: error.message, duration });
      toast({
        variant: "destructive",
        title: "Analytics Test Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "JSON copied successfully",
    });
  };

  const ResultDisplay = ({ result }: { result: any }) => {
    if (!result) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className={result.success ? "text-green-600" : "text-destructive"}>
              {result.success ? "✓ Success" : "✗ Error"}
            </span>
            <span className="text-sm text-muted-foreground">{result.duration}ms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Textarea
              value={JSON.stringify(result, null, 2)}
              readOnly
              className="font-mono text-sm min-h-[300px]"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edge Function Tester</h2>
        <p className="text-muted-foreground">Test your edge functions with sample queries</p>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schema">Schema Registry</TabsTrigger>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Schema Registry</CardTitle>
              <CardDescription>
                Fetch the complete schema registry showing all mapped tables and their structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testSchemaRegistry} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Get Schema
                  </>
                )}
              </Button>
              <ResultDisplay result={schemaResult} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Builder</CardTitle>
              <CardDescription>
                Build and execute queries with filters, sorting, and pagination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Query Input (JSON)</label>
                <Textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter your query JSON..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setQueryInput(JSON.stringify({
                    table: "assessments",
                    select: ["id", "name", "status"],
                    filters: [
                      { column: "status", operator: "eq", value: "Complete" }
                    ],
                    sort: { column: "id", order: "asc" },
                    limit: 10
                  }, null, 2))}
                >
                  Load Example
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setQueryInput("")}
                >
                  Clear
                </Button>
                <Button 
                  onClick={testQueryBuilder} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Query"
                  )}
                </Button>
              </div>
              <ResultDisplay result={queryResult} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Query</CardTitle>
              <CardDescription>
                Run aggregation queries (COUNT, SUM, AVG, MIN, MAX) with grouping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Analytics Input (JSON)</label>
                <Textarea
                  value={analyticsInput}
                  onChange={(e) => setAnalyticsInput(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter your analytics query JSON..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAnalyticsInput(JSON.stringify({
                    table: "assessments",
                    aggregation: {
                      type: "count",
                      column: "id",
                      groupBy: "status"
                    }
                  }, null, 2))}
                >
                  Load Example
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAnalyticsInput("")}
                >
                  Clear
                </Button>
                <Button 
                  onClick={testAnalytics} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Analytics"
                  )}
                </Button>
              </div>
              <ResultDisplay result={analyticsResult} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
