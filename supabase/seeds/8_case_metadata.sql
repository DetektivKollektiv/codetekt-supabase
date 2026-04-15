-- ============================================
-- SEED: Case Metadata
-- Tables: case_titles, case_categories, case_keywords
-- Extracted from review answer JSON data into dedicated tables
-- ============================================

-- ============================================
-- Case Titles (one per case)
-- ============================================

INSERT INTO public.case_titles (case_id, value, created_by)
VALUES
  -- MDR case (1111...) - title from first reviewer (Gorm)
  (
    '11111111-1111-4111-8111-111111111111',
    'MDR: Tschechien schickt Botschafter aus Russland zurück',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
;

-- ============================================
-- Case Categories (one per case)
-- Valid values: satire, report, text_message, opinion
-- ============================================

INSERT INTO public.case_categories (case_id, value, created_by)
VALUES
  -- MDR case (1111...) - category set by first reviewer (Gorm)
  (
    '11111111-1111-4111-8111-111111111111',
    'report',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
;

-- ============================================
-- Case Keywords (one row per user per case, max 3 keywords)
-- ============================================

INSERT INTO public.case_keywords (case_id, created_by, values)
VALUES
  -- MDR case (1111...) - Gorm's keywords
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ARRAY['Ukraine', 'Russland', 'Tschechien']
  ),
  -- MDR case (1111...) - Anna's keywords
  (
    '11111111-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ARRAY['Ukraine', 'Russland', 'Tschechien']
  )
;
