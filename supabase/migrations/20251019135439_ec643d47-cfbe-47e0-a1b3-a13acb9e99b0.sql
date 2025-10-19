-- Create query_learnings table for AI self-learning
CREATE TABLE public.query_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_pattern text NOT NULL,
  interpretation text NOT NULL,
  tables_involved jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmation_type text NOT NULL CHECK (confirmation_type IN ('confirmed', 'corrected', 'clarified')),
  original_query text,
  corrected_interpretation text,
  confidence_score numeric NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count integer NOT NULL DEFAULT 1 CHECK (usage_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.query_learnings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own learnings"
  ON public.query_learnings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learnings"
  ON public.query_learnings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learnings"
  ON public.query_learnings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_query_learnings_user_confidence 
  ON public.query_learnings(user_id, confidence_score DESC, usage_count DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_query_learnings_updated_at
  BEFORE UPDATE ON public.query_learnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();