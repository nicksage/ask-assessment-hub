export interface AssessmentItem {
  id: string;
  label: string;
  score: number;
  max: number;
  timestamp: string;
}

export interface AssessmentResult {
  user: string;
  assessment_id: string;
  completed_count: number;
  total_items: number;
  score_percent: number;
  items: AssessmentItem[];
  chart?: {
    type: 'bar' | 'line';
    x: string;
    y: string;
    yMax?: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: AssessmentResult;
}
