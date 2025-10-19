import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Search, Wrench } from "lucide-react";
import { ToolBuilderDialog } from "@/components/ToolBuilderDialog";
import { ToolCard } from "@/components/ToolCard";

interface CustomTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  tables_used: any; // JSONB type from database
  status: string;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

const ToolBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadTools();
  }, [user, navigate]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading tools",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_tools")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Tool deleted",
        description: "Custom tool has been deleted successfully",
      });
      loadTools();
    } catch (error: any) {
      toast({
        title: "Error deleting tool",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Tool Builder</h1>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tool
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {tools.length} {tools.length === 1 ? "tool" : "tools"}
            </Badge>
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No tools found" : "No custom tools yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first custom query tool to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tool
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onDelete={handleDeleteTool}
                onRefresh={loadTools}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <ToolBuilderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadTools}
      />
    </div>
  );
};

export default ToolBuilder;
