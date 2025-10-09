import { AssessmentResult } from '@/types/assessment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DataTableProps {
  data: AssessmentResult;
}

export function DataTable({ data }: DataTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assessment Results</CardTitle>
          <Badge variant="secondary">
            {data.completed_count}/{data.total_items} completed
          </Badge>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>ID: {data.assessment_id}</span>
          <span>User: {data.user}</span>
          <span>Score: {data.score_percent}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell className="text-right">{item.score}</TableCell>
                <TableCell className="text-right">{item.max}</TableCell>
                <TableCell className="text-muted-foreground">{item.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
