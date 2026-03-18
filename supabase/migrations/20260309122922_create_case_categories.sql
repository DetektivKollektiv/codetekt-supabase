-- ============================================
-- MIGRATION: Case Categories
-- Separate table for case category (extracted from review answer JSON content_type)
-- Valid values: satire, report, text_message, opinion
-- ============================================

CREATE TABLE public.case_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  value text NOT NULL CHECK (value IN ('satire', 'report', 'text_message', 'opinion')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.case_categories ENABLE ROW LEVEL SECURITY;

-- Primary key
CREATE UNIQUE INDEX case_categories_pkey ON public.case_categories USING btree (id);
ALTER TABLE public.case_categories ADD CONSTRAINT case_categories_pkey PRIMARY KEY USING INDEX case_categories_pkey;

-- One category per case
CREATE UNIQUE INDEX case_categories_case_id_unique ON public.case_categories USING btree (case_id);
ALTER TABLE public.case_categories ADD CONSTRAINT case_categories_case_id_unique UNIQUE USING INDEX case_categories_case_id_unique;

-- Indexes
CREATE INDEX idx_case_categories_created_by ON public.case_categories USING btree (created_by);
CREATE INDEX idx_case_categories_updated_by ON public.case_categories USING btree (updated_by);
CREATE INDEX idx_case_categories_value ON public.case_categories USING btree (value);

-- ============================================
-- TRIGGER: Auto-update updated_at on UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.set_case_category_updated_at()
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

CREATE TRIGGER set_case_category_updated_at_trigger
  BEFORE UPDATE ON public.case_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_category_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Everyone can view case categories
CREATE POLICY "Case categories are viewable by everyone."
  ON public.case_categories
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- Any authenticated user can create a category
CREATE POLICY "Authenticated users can create case categories."
  ON public.case_categories
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Only admins can update case categories
CREATE POLICY "Admins can update case categories."
  ON public.case_categories
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())));

-- Only admins can delete case categories
CREATE POLICY "Admins can delete case categories."
  ON public.case_categories
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid())));

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON TABLE public.case_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_categories TO authenticated;
GRANT ALL ON TABLE public.case_categories TO service_role;
