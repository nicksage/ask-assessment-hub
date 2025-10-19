-- Update the create_user_table_from_schema function to use new system column names
CREATE OR REPLACE FUNCTION public.create_user_table_from_schema(p_table_name text, p_columns jsonb, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sql text;
  v_column_def text;
  v_column jsonb;
  v_result jsonb;
BEGIN
  -- Validate table name (only lowercase letters, numbers, and underscores)
  IF p_table_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name. Use only lowercase letters, numbers, and underscores.';
  END IF;
  
  -- Check if table already exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Table already exists'
    );
  END IF;
  
  -- Start building CREATE TABLE statement with new system column names
  v_sql := format('CREATE TABLE public.%I (', p_table_name);
  v_sql := v_sql || 'record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ';
  v_sql := v_sql || 'user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, ';
  v_sql := v_sql || 'source_endpoint_id uuid REFERENCES public.api_endpoints(id), ';
  
  -- Add custom columns from schema
  FOR v_column IN SELECT * FROM jsonb_array_elements(p_columns)
  LOOP
    v_column_def := format('%I %s', 
      v_column->>'name',
      v_column->>'type'
    );
    v_sql := v_sql || v_column_def || ', ';
  END LOOP;
  
  -- Add timestamps with new names
  v_sql := v_sql || 'synced_at timestamptz DEFAULT now(), ';
  v_sql := v_sql || 'record_updated_at timestamptz DEFAULT now()';
  v_sql := v_sql || ')';
  
  -- Execute table creation
  EXECUTE v_sql;
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Create RLS policies
  EXECUTE format('
    CREATE POLICY "Users can view their own data" 
    ON public.%I FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id)', 
    p_table_name
  );
  
  EXECUTE format('
    CREATE POLICY "Users can insert their own data" 
    ON public.%I FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id)', 
    p_table_name
  );
  
  EXECUTE format('
    CREATE POLICY "Users can update their own data" 
    ON public.%I FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)', 
    p_table_name
  );
  
  EXECUTE format('
    CREATE POLICY "Users can delete their own data" 
    ON public.%I FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id)', 
    p_table_name
  );
  
  -- Create trigger for record_updated_at
  EXECUTE format('
    CREATE TRIGGER update_%I_record_updated_at 
    BEFORE UPDATE ON public.%I 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column()',
    p_table_name,
    p_table_name
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'table_name', p_table_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;