-- Enforce max 3 keywords per user keyword set.
-- Existing rows with more than 3 values must be cleaned up before this migration.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.case_keywords
    WHERE array_length(values, 1) > 3
  ) THEN
    RAISE EXCEPTION 'case_keywords contains rows with more than 3 values. Clean those rows before applying this migration.';
  END IF;
END $$;

ALTER TABLE public.case_keywords
  DROP CONSTRAINT IF EXISTS case_keywords_max_count;

ALTER TABLE public.case_keywords
  ADD CONSTRAINT case_keywords_max_count CHECK (array_length(values, 1) <= 3);

COMMENT ON CONSTRAINT case_keywords_max_count ON public.case_keywords
  IS 'Each user keyword set may contain at most 3 keywords.';
