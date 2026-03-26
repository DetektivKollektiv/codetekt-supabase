-- ============================================
-- MIGRATION: Case Factchecks
-- One row per case with factcheck status/details
-- ============================================

CREATE TABLE public.case_factchecks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  has_factcheck boolean NOT NULL,
  details text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_factchecks_details_length_check CHECK (
    details IS NULL OR char_length(details) <= 2000
  )
);

ALTER TABLE public.case_factchecks ENABLE ROW LEVEL SECURITY;

-- Primary key
CREATE UNIQUE INDEX case_factchecks_pkey ON public.case_factchecks USING btree (id);
ALTER TABLE public.case_factchecks ADD CONSTRAINT case_factchecks_pkey PRIMARY KEY USING INDEX case_factchecks_pkey;

-- One factcheck row per case
CREATE UNIQUE INDEX case_factchecks_case_id_unique ON public.case_factchecks USING btree (case_id);
ALTER TABLE public.case_factchecks ADD CONSTRAINT case_factchecks_case_id_unique UNIQUE USING INDEX case_factchecks_case_id_unique;

-- Indexes
CREATE INDEX idx_case_factchecks_created_by ON public.case_factchecks USING btree (created_by);
CREATE INDEX idx_case_factchecks_updated_by ON public.case_factchecks USING btree (updated_by);
CREATE INDEX idx_case_factchecks_has_factcheck ON public.case_factchecks USING btree (has_factcheck);

-- ============================================
-- TRIGGER: Auto-update updated_at on UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.set_case_factcheck_updated_at()
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

CREATE TRIGGER set_case_factcheck_updated_at_trigger
  BEFORE UPDATE ON public.case_factchecks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_factcheck_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Everyone can view case factchecks
CREATE POLICY "Case factchecks are viewable by everyone."
  ON public.case_factchecks
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can create their own factcheck row
CREATE POLICY "Authenticated users can create case factchecks."
  ON public.case_factchecks
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Users can update their own factcheck row
CREATE POLICY "Users can update their own case factchecks."
  ON public.case_factchecks
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Users can delete their own factcheck row
CREATE POLICY "Users can delete their own case factchecks."
  ON public.case_factchecks
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON TABLE public.case_factchecks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_factchecks TO authenticated;
GRANT ALL ON TABLE public.case_factchecks TO service_role;
