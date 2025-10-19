import { useState } from "react";
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [toolDefinition, setToolDefinition] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleReset = () => {
    setStep(1);
    setDescription("");
    setToolDefinition(null);
    setGeneratedCode("");
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleGenerateDefinition = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe what your tool should do",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate tool definition
      const { data, error } = await supabase.functions.invoke(
        "generate-tool-definition",
        {
          body: { description },
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

  const handleGenerateAndDeploy = async () => {
    try {
      setLoading(true);
      setStep(3);

      // Generate code
      const { data: codeData, error: codeError } = await supabase.functions.invoke(
        "generate-tool-code",
        {
          body: { tool_definition: toolDefinition },
        }
      );

      if (codeError) throw codeError;
      if (!codeData.success) {
        throw new Error(codeData.error || "Failed to generate code");
      }

      setGeneratedCode(codeData.edge_function_code);

      // Save to database
      const { error: dbError } = await supabase.from("custom_tools").insert({
        display_name:
          toolDefinition.function_name
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        description: toolDefinition.description,
        tables_used: toolDefinition.tables_used,
        tool_schema: toolDefinition.tool_schema,
        edge_function_code: codeData.edge_function_code,
        status: "active",
      } as any);

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
      setStep(2);
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
            Create Custom Tool - Step {step}/3
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Describe what your tool should do"}
            {step === 2 && "Review and confirm tool details"}
            {step === 3 && "Generating and deploying your tool"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
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
              <Button onClick={handleGenerateDefinition} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Next Step →
              </Button>
            </div>
          </div>
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
                  disabled
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
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateAndDeploy} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate & Deploy →
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
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
