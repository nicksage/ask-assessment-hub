
-- Step 1: Clean up duplicates in entity_types (keep most recent)
DELETE FROM entity_types
WHERE record_id IN (
  SELECT record_id
  FROM (
    SELECT record_id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, source_endpoint_id, id 
             ORDER BY COALESCE(synced_at, record_updated_at, created_at) DESC
           ) as rn
    FROM entity_types
    WHERE id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 2: Add unique constraints to all schema tables
ALTER TABLE assessments 
ADD CONSTRAINT unique_user_endpoint_record_assessments 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE risks 
ADD CONSTRAINT unique_user_endpoint_record_risks 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE entities 
ADD CONSTRAINT unique_user_endpoint_record_entities 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE entity_risks 
ADD CONSTRAINT unique_user_endpoint_record_entity_risks 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE entity_types 
ADD CONSTRAINT unique_user_endpoint_record_entity_types 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE risk_categories 
ADD CONSTRAINT unique_user_endpoint_record_risk_categories 
UNIQUE (user_id, source_endpoint_id, id);

ALTER TABLE assessment_periods 
ADD CONSTRAINT unique_user_endpoint_record_assessment_periods 
UNIQUE (user_id, source_endpoint_id, id);
