-- Add unique constraints on the bigint id columns
ALTER TABLE public.risk_categories
ADD CONSTRAINT unique_risk_categories_id UNIQUE (id);

ALTER TABLE public.risks
ADD CONSTRAINT unique_risks_id UNIQUE (id);

-- Add the main foreign key relationship that was causing the error
ALTER TABLE public.risks
ADD CONSTRAINT fk_risks_risk_category
FOREIGN KEY (risk_category_id)
REFERENCES public.risk_categories(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_risks_risk_category_id ON public.risks(risk_category_id);

-- Note: Not adding entity_risks foreign keys due to existing data integrity issues
-- These should be cleaned up before adding those constraints