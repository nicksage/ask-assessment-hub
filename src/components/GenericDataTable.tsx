import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface GenericDataTableProps {
  data: any[];
  title?: string;
}

export function GenericDataTable({ data, title }: GenericDataTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  // Extract column names from first object
  const columns = Object.keys(data[0]);
  
  // Format column header (snake_case to Title Case)
  const formatHeader = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format cell value based on type
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') {
      if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-'))) {
        try {
          return format(new Date(value), 'MMM dd, yyyy');
        } catch {
          return String(value);
        }
      }
      return JSON.stringify(value);
    }
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  // Determine if column should be right-aligned
  const isNumeric = (key: string): boolean => {
    const firstValue = data[0][key];
    return typeof firstValue === 'number';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {title && <CardTitle>{title}</CardTitle>}
          <Badge variant="secondary">
            {data.length} {data.length === 1 ? 'row' : 'rows'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col}
                    className={isNumeric(col) ? 'text-right' : ''}
                  >
                    {formatHeader(col)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell 
                      key={col}
                      className={isNumeric(col) ? 'text-right' : ''}
                    >
                      {formatValue(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
