import { ChatMessage } from '@/types/assessment';
import { getAssessmentResults, getToolDefinition } from './mockDataService';

const SYSTEM_PROMPT = `You are an AI assistant for assessment data queries. You help users find and analyze assessment results.

When users ask about assessments, use the get_assessment_results tool to fetch data. Always provide clear, natural language summaries of the data.

Available assessments: A-104 (simon@telus.com), A-205 (jane@telus.com)`;

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[]): Promise<{ message: string; data?: any }> {
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        tools: [getToolDefinition()],
        tool_choice: 'auto'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    // Handle tool calls
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      const assessmentData = getAssessmentResults(args.assessment_id);

      if (!assessmentData) {
        return {
          message: `Assessment ${args.assessment_id} not found. Available assessments: A-104, A-205`
        };
      }

      // Make second call with tool result
      const followUpResponse = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            ...openaiMessages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(assessmentData)
            }
          ]
        })
      });

      const followUpData = await followUpResponse.json();
      return {
        message: followUpData.choices[0].message.content,
        data: assessmentData
      };
    }

    return { message: choice.message.content };
  }
}
