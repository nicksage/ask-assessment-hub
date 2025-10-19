-- Create enum for tool status
CREATE TYPE public.tool_status AS ENUM ('draft', 'generating', 'active', 'error');

-- Create custom_tools table
CREATE TABLE public.custom_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  tables_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_schema JSONB NOT NULL,
  edge_function_code TEXT,
  status tool_status NOT NULL DEFAULT 'draft',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT unique_user_tool_name UNIQUE (user_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tools"
ON public.custom_tools
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tools"
ON public.custom_tools
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools"
ON public.custom_tools
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools"
ON public.custom_tools
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_tools_updated_at
BEFORE UPDATE ON public.custom_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_custom_tools_user_status ON public.custom_tools(user_id, status);
CREATE INDEX idx_custom_tools_name ON public.custom_tools(user_id, name);