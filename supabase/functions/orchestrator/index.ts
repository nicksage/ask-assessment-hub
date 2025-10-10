import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  threadId?: string;
  assistantId: string;
  userMessage: string;
  toolArgs?: {
    user_identifier?: string;
    assessment_id?: string;
    filters?: {
      status?: 'All' | 'Completed' | 'Incomplete';
      date_from?: string;
      date_to?: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const OPENAI_BASE = Deno.env.get('OPENAI_BASE') || 'https://api.openai.com/v1';
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { threadId: existingThreadId, assistantId, userMessage, toolArgs } = body;

    if (!assistantId || !userMessage) {
      throw new Error('assistantId and userMessage are required');
    }

    let threadId = existingThreadId;

    // Create thread if missing
    if (!threadId) {
      console.log('Creating new thread...');
      const threadResponse = await fetch(`${OPENAI_BASE}/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.text();
        throw new Error(`Failed to create thread: ${error}`);
      }

      const thread = await threadResponse.json();
      threadId = thread.id;
      console.log('Thread created:', threadId);
    }

    // Add user message to thread
    console.log('Adding message to thread...');
    const messageResponse = await fetch(`${OPENAI_BASE}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage
      })
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      throw new Error(`Failed to add message: ${error}`);
    }

    // Create run
    console.log('Creating run...');
    const runResponse = await fetch(`${OPENAI_BASE}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Failed to create run: ${error}`);
    }

    let run = await runResponse.json();
    console.log('Run created:', run.id);

    // Poll run until terminal
    while (!['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
      if (run.status === 'requires_action') {
        console.log('Run requires action, processing tool calls...');
        
        const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          console.log('Processing tool call:', toolCall.function.name);
          
          if (toolCall.function.name === 'assessments.get_results.v1') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Query Supabase for assessment data
            // Note: Tables need to be created - using mock structure for now
            try {
              // This is a placeholder query - actual table structure will be created next
              const { data: assessmentData, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('assessment_id', args.assessment_id || toolArgs?.assessment_id)
                .single();

              if (error) {
                console.error('Supabase query error:', error);
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({
                    error: 'Assessment not found or database tables not yet created'
                  })
                });
              } else {
                // Build response in expected format
                const result = {
                  user: assessmentData.user_email || args.user_identifier,
                  assessment_id: assessmentData.assessment_id,
                  completed_count: assessmentData.completed_count || 0,
                  total_items: assessmentData.total_items || 0,
                  score_percent: assessmentData.score_percent || 0,
                  items: assessmentData.items || [],
                  chart: {
                    type: 'bar',
                    x: 'label',
                    y: 'score',
                    yMax: 'max',
                    title: `Assessment ${assessmentData.assessment_id} — Scores by Item`
                  }
                };

                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(result)
                });
              }
            } catch (dbError) {
              console.error('Database error:', dbError);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  error: 'Database error occurred'
                })
              });
            }
          } else {
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                error: `Unsupported function: ${toolCall.function.name}`
              })
            });
          }
        }

        // Submit tool outputs
        console.log('Submitting tool outputs...');
        const submitResponse = await fetch(
          `${OPENAI_BASE}/threads/${threadId}/runs/${run.id}/submit_tool_outputs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({ tool_outputs: toolOutputs })
          }
        );

        if (!submitResponse.ok) {
          const error = await submitResponse.text();
          throw new Error(`Failed to submit tool outputs: ${error}`);
        }

        run = await submitResponse.json();
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Poll run status
      const pollResponse = await fetch(`${OPENAI_BASE}/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!pollResponse.ok) {
        const error = await pollResponse.text();
        throw new Error(`Failed to poll run: ${error}`);
      }

      run = await pollResponse.json();
      console.log('Run status:', run.status);
    }

    // Get latest message
    console.log('Fetching latest messages...');
    const messagesResponse = await fetch(
      `${OPENAI_BASE}/threads/${threadId}/messages?limit=1&order=desc`,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      throw new Error(`Failed to fetch messages: ${error}`);
    }

    const messagesData = await messagesResponse.json();
    const latestMessage = messagesData.data[0];

    return new Response(
      JSON.stringify({
        threadId,
        run,
        latestMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
