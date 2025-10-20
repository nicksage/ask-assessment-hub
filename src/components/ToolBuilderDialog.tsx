import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { GuidedToolBuilder, type WizardData } from "./GuidedToolBuilder";
import { ToolTester } from "./ToolTester";

interface ToolBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ToolBuilderDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: ToolBuilderDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'simple' | 'guided'>('simple');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [toolDefinition, setToolDefinition] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [schemaRegistry, setSchemaRegistry] = useState<any>(null);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [preserveWizardState, setPreserveWizardState] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSchemaRegistry();
    }
  }, [open]);

  const loadSchemaRegistry = async () => {
    try {
      setSchemaLoading(true);
      setSchemaError(null);
      const { data, error } = await supabase.functions.invoke('get-schema-registry');
      if (error) throw error;
      setSchemaRegistry(data);
    } catch (error: any) {
      console.error('Failed to load schema:', error);
      setSchemaError(error.message || 'Failed to load database schema');
      toast({
        title: "Schema loading failed",
        description: "Unable to load database schema. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleReset = () => {
    setMode('simple');
    setStep(1);
    setDescription("");
    setToolDefinition(null);
    setGeneratedCode("");
    setLoading(false);
  };

  const handleWizardComplete = async (data: WizardData) => {
    setWizardData(data);
    setPreserveWizardState(true);
    
    // Use user's description + structured config
    const userIntent = data.toolDescription;
    
    // Build structured requirements
    const structuredParts: string[] = [];
    structuredParts.push(`Tables: ${data.selectedTables.join(', ')}`);
    
    // Column selection details
    const columnDetails = Object.entries(data.selectedColumns)
      .map(([table, cols]) => 
        cols.length === 0 
          ? `${table}: *all columns*` 
          : `${table}: ${cols.join(', ')}`
      )
      .join('; ');
    if (columnDetails) {
      structuredParts.push(`Columns: ${columnDetails}`);
    }
    
    if (data.filters.length > 0) {
      structuredParts.push('Filters: ' + data.filters.map(f => 
        `${f.table}.${f.column} ${f.operator} {${f.paramName}}`
      ).join(', '));
    }
    
    if (data.sorting) {
      structuredParts.push(`Sorting: ${data.sorting.table}.${data.sorting.column} ${data.sorting.direction}`);
    }
    
    if (data.limit) {
      structuredParts.push(`Limit: ${data.limit} results`);
    }
    
    // Combine user intent with structured requirements
    const enhancedDescription = `USER INTENT: ${userIntent}\n\nSTRUCTURED REQUIREMENTS:\n${structuredParts.join('\n')}`;
    
    setDescription(userIntent); // Store user's original description for display
    
    // Generate tool definition with enhanced prompt
    await handleGenerateDefinition(enhancedDescription, data);
  };

  const handleClose = () => {
    setPreserveWizardState(false);
    handleReset();
    onOpenChange(false);
  };

  const handleGenerateDefinition = async (customDescription?: string, wizardData?: WizardData) => {
    const desc = customDescription || description;
    
    if (!desc.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what your tool should do",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate tool definition WITH schema context and wizard data
      const { data, error } = await supabase.functions.invoke(
        "generate-tool-definition",
        {
          body: { 
            description: desc,
            schema_registry: schemaRegistry,
            wizard_data: wizardData // Pass structured config to AI
          },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to generate tool definition");
      }

      setToolDefinition(data.tool_definition);
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setLoading(true);

      // Generate code WITH schema context
      const { data: codeData, error: codeError } = await supabase.functions.invoke(
        "generate-tool-code",
        {
          body: { 
            tool_definition: toolDefinition,
            schema_registry: schemaRegistry
          },
        }
      );

      if (codeError) throw codeError;
      if (!codeData.success) {
        throw new Error(codeData.error || "Failed to generate code");
      }

      setGeneratedCode(codeData.edge_function_code);
      setStep(3); // Move to test step
    } catch (error: any) {
      toast({
        title: "Code generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setLoading(true);
      setStep(4); // Deployment step

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      // Save to database
      const { error: dbError } = await supabase.from("custom_tools").insert({
        user_id: user.id,
        name: toolDefinition.function_name,
        display_name:
          toolDefinition.function_name
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        description: toolDefinition.description,
        tables_used: toolDefinition.tables_used,
        tool_schema: toolDefinition.tool_schema,
        edge_function_code: generatedCode,
        status: "active",
      });

      if (dbError) throw dbError;

      toast({
        title: "Tool created successfully",
        description: "Your custom tool is now available in the AI chat",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Deployment failed",
        description: error.message,
        variant: "destructive",
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Custom Tool - Step {step}/4
          </DialogTitle>
          <DialogDescription>
            {step === 1 && mode === 'simple' && "Choose how to build your tool"}
            {step === 1 && mode === 'guided' && "Follow the guided wizard"}
            {step === 2 && "Review and confirm tool details"}
            {step === 3 && "Test your tool before deploying"}
            {step === 4 && "Deploying your tool"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && mode === 'simple' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button variant="outline" onClick={() => setMode('guided')} className="h-20 flex-col gap-2">
                <span className="font-semibold">Guided Builder</span>
                <span className="text-xs text-muted-foreground">Step-by-step wizard</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 border-primary">
                <span className="font-semibold">Simple Mode</span>
                <span className="text-xs text-muted-foreground">Text description</span>
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tool Description</Label>
              <Textarea
                id="description"
                placeholder="Example: Get all vendors with estimated spend over $10,000 sorted by spend descending"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">💡 Example descriptions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• "Get all high-risk entities by type"</li>
                <li>• "Find assessments completed in the last 30 days"</li>
                <li>• "List vendors with no associated risks"</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleGenerateDefinition()} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Next Step →
              </Button>
            </div>
          </div>
        )}

        {step === 1 && mode === 'guided' && (
          <>
            {schemaLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading database schema...</p>
              </div>
            )}
            
            {schemaError && !schemaLoading && (
              <div className="space-y-4">
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive">{schemaError}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMode('simple')}>
                    Back to Simple Mode
                  </Button>
                  <Button onClick={loadSchemaRegistry}>
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {schemaRegistry && !schemaLoading && (
              <GuidedToolBuilder
                schemaRegistry={schemaRegistry}
                onComplete={handleWizardComplete}
                onCancel={() => {
                  setMode('simple');
                  setPreserveWizardState(false);
                }}
                initialData={preserveWizardState ? wizardData : undefined}
              />
            )}
          </>
        )}

        {step === 2 && toolDefinition && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Tool Name</Label>
                <Input value={toolDefinition.function_name} disabled />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={toolDefinition.description}
                  onChange={(e) => setToolDefinition({
                    ...toolDefinition,
                    description: e.target.value
                  })}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {toolDefinition.tables_used && toolDefinition.tables_used.length > 0 && (
                <div>
                  <Label>Tables Needed</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {toolDefinition.tables_used.map((table: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Query Logic</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 rounded-lg bg-muted">
                  {toolDefinition.query_logic}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep(1);
                  setPreserveWizardState(false);
                }} 
                disabled={loading}
              >
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateCode} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Code & Test →
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && toolDefinition && generatedCode && (
          <ToolTester
            toolDefinition={toolDefinition}
            generatedCode={generatedCode}
            onRegenerateCode={handleGenerateCode}
            onDeploy={handleDeploy}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <div className="space-y-4 py-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span>Tool Definition Generated</span>
              </div>
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span>Edge Function Code Generated</span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-blue-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Deploying Tool...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Tool Deployed Successfully</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4 mt-6">
              <p className="text-sm font-medium mb-2">
                ✨ Your tool is ready to use!
              </p>
              <p className="text-sm text-muted-foreground">
                Go to the chat interface and try asking something like:
                <br />
                <span className="font-mono text-xs bg-background px-2 py-1 rounded mt-2 inline-block">
                  "{description}"
                </span>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
