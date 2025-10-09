import { AssessmentResult } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AssessmentChartProps {
  data: AssessmentResult;
}

export function AssessmentChart({ data }: AssessmentChartProps) {
  if (!data.chart) return null;

  const chartData = data.items.map(item => ({
    name: item.label,
    score: item.score,
    max: item.max
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.chart.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              className="text-xs"
            />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="score" fill="hsl(var(--primary))" name="Score" />
            <Bar dataKey="max" fill="hsl(var(--muted))" name="Max" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
