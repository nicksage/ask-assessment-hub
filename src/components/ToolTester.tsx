import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ToolTesterProps {
  toolDefinition: any;
  generatedCode: string;
  onRegenerateCode: () => void;
  onDeploy: () => void;
  onBack: () => void;
}

export const ToolTester = ({ 
  toolDefinition, 
  generatedCode,
  onRegenerateCode,
  onDeploy,
  onBack
}: ToolTesterProps) => {
  const { toast } = useToast();
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const parameters = toolDefinition?.tool_schema?.function?.parameters?.properties || {};
  const requiredParams = toolDefinition?.tool_schema?.function?.parameters?.required || [];

  const handleTestTool = async () => {
    try {
      setTestLoading(true);
      setTestResults(null);

      console.log('Testing tool with params:', testParams);

      const { data, error } = await supabase.functions.invoke('test-custom-tool', {
        body: {
          code: generatedCode,
          params: testParams,
          tool_definition: toolDefinition
        }
      });

      if (error) throw error;

      setTestResults(data);

      if (data.success) {
        toast({
          title: "Test successful",
          description: `Query returned ${data.count || 0} results`,
        });
      } else {
        toast({
          title: "Test failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Test execution error:', error);
      toast({
        title: "Test execution failed",
        description: error.message,
        variant: "destructive"
      });
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  const updateParam = (paramName: string, value: any) => {
    setTestParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Test Your Tool
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Provide test values and execute the tool to verify it works correctly
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="test" className="flex-1">Test Tool</TabsTrigger>
          <TabsTrigger value="code" className="flex-1">
            <Code className="h-4 w-4 mr-2" />
            View Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4 mt-4">

      {/* Parameter Inputs */}
      <div className="space-y-3 rounded-lg border p-4">
        <Label className="text-sm font-medium">Test Parameters</Label>
        
        {Object.keys(parameters).length === 0 ? (
          <p className="text-sm text-muted-foreground">No parameters required</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(parameters).map(([paramName, paramSchema]: [string, any]) => (
              <div key={paramName} className="space-y-1">
                <Label htmlFor={paramName} className="flex items-center gap-2">
                  {paramName}
                  {requiredParams.includes(paramName) && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </Label>
                <Input
                  id={paramName}
                  type={paramSchema.type === 'number' ? 'number' : 'text'}
                  placeholder={paramSchema.description || `Enter ${paramName}`}
                  value={testParams[paramName] || ''}
                  onChange={(e) => updateParam(paramName, 
                    paramSchema.type === 'number' ? parseFloat(e.target.value) : e.target.value
                  )}
                />
                {paramSchema.description && (
                  <p className="text-xs text-muted-foreground">{paramSchema.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={handleTestTool} 
          disabled={testLoading}
          className="w-full"
        >
          {testLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Play className="h-4 w-4 mr-2" />
          Run Test
        </Button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-3">
          <Alert variant={testResults.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {testResults.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {testResults.success ? (
                    <div>
                      <p className="font-medium">Test Passed!</p>
                      <p className="text-sm mt-1">
                        Returned {testResults.count || 0} results
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Test Failed</p>
                      <p className="text-sm mt-1">{testResults.error}</p>
                      {testResults.suggestion && (
                        <div className="mt-2 flex items-start gap-2 text-xs bg-background/50 p-2 rounded">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>{testResults.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {testResults.success && testResults.data && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Sample Results:</p>
              <div className="max-h-[200px] overflow-auto">
                <pre className="text-xs bg-muted p-2 rounded">
                  {JSON.stringify(testResults.data.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Review
        </Button>
        <div className="flex gap-2">
          {testResults && !testResults.success && (
            <Button variant="outline" onClick={onRegenerateCode}>
              Regenerate Code
            </Button>
          )}
          <Button 
            onClick={onDeploy}
            disabled={testResults && !testResults.success}
          >
            Deploy Tool
          </Button>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Generated Code</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  toast({
                    title: "Copied to clipboard",
                    description: "Code has been copied to your clipboard",
                  });
                }}
              >
                Copy Code
              </Button>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <pre className="text-xs bg-muted p-4 rounded">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              ← Back to Review
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRegenerateCode}>
                Regenerate Code
              </Button>
              <Button 
                onClick={onDeploy}
                disabled={testResults && !testResults.success}
              >
                Deploy Tool
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
