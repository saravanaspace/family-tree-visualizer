-- Add new date column
ALTER TABLE family_members ADD COLUMN birth_date_new date;

-- Update the new column with converted dates
UPDATE family_members 
SET birth_date_new = CASE 
    WHEN birth_date IS NULL THEN NULL
    WHEN birth_date ~ '^\d{4}-\d{2}-\d{2}$' THEN birth_date::date
    ELSE NULL 
END;

-- Drop the old column
ALTER TABLE family_members DROP COLUMN birth_date;

-- Rename the new column to birth_date
ALTER TABLE family_members RENAME COLUMN birth_date_new TO birth_date;