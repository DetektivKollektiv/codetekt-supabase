-- ============================================
-- MIGRATION: Case Keywords
-- One row per user per case, storing that user's keyword set as text[].
-- Max 5 keywords per user enforced by DB CHECK.
-- Max 10 total per case + first-user-gets-5/subsequent-get-3 logic: app-level only.
-- ============================================

CREATE TABLE public.case_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  values text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Each keyword must be non-empty and max 50 chars (checked at app level for individual items)
  CONSTRAINT case_keywords_max_count CHECK (array_length(values, 1) <= 5),
  CONSTRAINT case_keywords_not_empty CHECK (array_length(values, 1) >= 1)
);

ALTER TABLE public.case_keywords ENABLE ROW LEVEL SECURITY;

-- Primary key
CREATE UNIQUE INDEX case_keywords_pkey ON public.case_keywords USING btree (id);
ALTER TABLE public.case_keywords ADD CONSTRAINT case_keywords_pkey PRIMARY KEY USING INDEX case_keywords_pkey;

-- One keyword set per user per case
CREATE UNIQUE INDEX case_keywords_case_user_unique ON public.case_keywords USING btree (case_id, created_by);
ALTER TABLE public.case_keywords ADD CONSTRAINT case_keywords_case_user_unique UNIQUE USING INDEX case_keywords_case_user_unique;

-- Indexes
CREATE INDEX idx_case_keywords_case_id ON public.case_keywords USING btree (case_id);
CREATE INDEX idx_case_keywords_created_by ON public.case_keywords USING btree (created_by);

-- ============================================
-- TRIGGER: Auto-update updated_at on UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.set_case_keywords_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_case_keywords_updated_at_trigger
  BEFORE UPDATE ON public.case_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_keywords_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Everyone can view keywords
CREATE POLICY "Case keywords are viewable by everyone."
  ON public.case_keywords
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert their own keyword set
CREATE POLICY "Authenticated users can create case keywords."
  ON public.case_keywords
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Users can only update their own keyword set
CREATE POLICY "Users can update their own case keywords."
  ON public.case_keywords
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Users can only delete their own keyword set
CREATE POLICY "Users can delete their own case keywords."
  ON public.case_keywords
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON TABLE public.case_keywords TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_keywords TO authenticated;
GRANT ALL ON TABLE public.case_keywords TO service_role;
