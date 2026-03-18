-- ============================================
-- MIGRATION: Case Titles
-- Separate table for case titles (extracted from review answer JSON)
-- ============================================

CREATE TABLE public.case_titles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  value text NOT NULL CHECK (char_length(value) >= 1 AND char_length(value) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.case_titles ENABLE ROW LEVEL SECURITY;

-- Primary key
CREATE UNIQUE INDEX case_titles_pkey ON public.case_titles USING btree (id);
ALTER TABLE public.case_titles ADD CONSTRAINT case_titles_pkey PRIMARY KEY USING INDEX case_titles_pkey;

-- One title per case
CREATE UNIQUE INDEX case_titles_case_id_unique ON public.case_titles USING btree (case_id);
ALTER TABLE public.case_titles ADD CONSTRAINT case_titles_case_id_unique UNIQUE USING INDEX case_titles_case_id_unique;

-- Indexes
CREATE INDEX idx_case_titles_created_by ON public.case_titles USING btree (created_by);
CREATE INDEX idx_case_titles_updated_by ON public.case_titles USING btree (updated_by);

-- ============================================
-- TRIGGER: Auto-update updated_at on UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.set_case_title_updated_at()
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

CREATE TRIGGER set_case_title_updated_at_trigger
  BEFORE UPDATE ON public.case_titles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_title_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Everyone can view case titles
CREATE POLICY "Case titles are viewable by everyone."
  ON public.case_titles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Any authenticated user can create a title
CREATE POLICY "Authenticated users can create case titles."
  ON public.case_titles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Only admins can update case titles
CREATE POLICY "Admins can update case titles."
  ON public.case_titles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())));

-- Only admins can delete case titles
CREATE POLICY "Admins can delete case titles."
  ON public.case_titles
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())));

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON TABLE public.case_titles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_titles TO authenticated;
GRANT ALL ON TABLE public.case_titles TO service_role;
