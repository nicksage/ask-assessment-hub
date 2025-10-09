import { AssessmentResult } from '@/types/assessment';

// Mock assessment data service
export const mockAssessmentData: Record<string, AssessmentResult> = {
  'A-104': {
    user: 'simon@telus.com',
    assessment_id: 'A-104',
    completed_count: 9,
    total_items: 9,
    score_percent: 94.4,
    items: [
      { id: 'Q1', label: 'Policy Awareness', score: 10, max: 10, timestamp: '2025-09-02' },
      { id: 'Q2', label: 'Risk Identification', score: 9, max: 10, timestamp: '2025-09-02' },
      { id: 'Q3', label: 'Control Testing', score: 10, max: 10, timestamp: '2025-09-03' },
      { id: 'Q4', label: 'Documentation Review', score: 9, max: 10, timestamp: '2025-09-03' },
      { id: 'Q5', label: 'Compliance Check', score: 10, max: 10, timestamp: '2025-09-04' },
      { id: 'Q6', label: 'Process Validation', score: 9, max: 10, timestamp: '2025-09-04' },
      { id: 'Q7', label: 'Evidence Collection', score: 10, max: 10, timestamp: '2025-09-05' },
      { id: 'Q8', label: 'Remediation Plan', score: 10, max: 10, timestamp: '2025-09-05' },
      { id: 'Q9', label: 'Final Approval', score: 8, max: 10, timestamp: '2025-09-06' }
    ],
    chart: {
      type: 'bar',
      x: 'label',
      y: 'score',
      yMax: 'max',
      title: 'Assessment Scores by Item'
    }
  },
  'A-205': {
    user: 'jane@telus.com',
    assessment_id: 'A-205',
    completed_count: 12,
    total_items: 12,
    score_percent: 87.5,
    items: [
      { id: 'Q1', label: 'Security Assessment', score: 9, max: 10, timestamp: '2025-09-10' },
      { id: 'Q2', label: 'Access Controls', score: 8, max: 10, timestamp: '2025-09-10' },
      { id: 'Q3', label: 'Data Protection', score: 9, max: 10, timestamp: '2025-09-11' },
      { id: 'Q4', label: 'Incident Response', score: 10, max: 10, timestamp: '2025-09-11' },
      { id: 'Q5', label: 'Audit Logs', score: 8, max: 10, timestamp: '2025-09-12' },
      { id: 'Q6', label: 'Encryption', score: 9, max: 10, timestamp: '2025-09-12' }
    ],
    chart: {
      type: 'bar',
      x: 'label',
      y: 'score',
      yMax: 'max',
      title: 'Security Assessment Scores'
    }
  }
};

export function getAssessmentResults(assessmentId: string): AssessmentResult | null {
  return mockAssessmentData[assessmentId] || null;
}

export function getToolDefinition() {
  return {
    type: 'function' as const,
    function: {
      name: 'get_assessment_results',
      description: 'Get assessment results for a specific assessment ID and user',
      parameters: {
        type: 'object',
        properties: {
          assessment_id: {
            type: 'string',
            description: 'The assessment ID (e.g., A-104, A-205)'
          },
          user: {
            type: 'string',
            description: 'User email (optional, for filtering)'
          }
        },
        required: ['assessment_id']
      }
    }
  };
}
