import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Wrench, Trash2, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    display_name: string;
    description: string;
    tables_used: any; // JSONB type from database
    status: string;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
  };
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const ToolCard = ({ tool, onDelete }: ToolCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "generating":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{tool.display_name}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {tool.name}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(tool.status)} variant="outline">
            {tool.status}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tool.description}
        </p>

        {/* Tables Used */}
        {tool.tables_used && tool.tables_used.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.tables_used.slice(0, 3).map((table, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {table}
              </Badge>
            ))}
            {tool.tables_used.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tool.tables_used.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{tool.usage_count} uses</span>
          </div>
          {tool.last_used_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(tool.last_used_at))} ago</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tool?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{tool.display_name}". This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(tool.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
