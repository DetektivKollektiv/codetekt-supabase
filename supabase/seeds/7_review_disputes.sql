-- ============================================
-- SEED: Case Disputes
-- Test data for Case Disputes System
-- ============================================

-- ============================================
-- UNRESOLVED DISPUTES (Open Admin Queue)
-- ============================================

-- Dispute 1: Content Type Dispute on Case 1 (Ukraine article)
-- Anna disputes that the article should be categorized as "opinion" instead of "nachrichtenartikel"
-- Status: Unresolved (waiting for admin review)
INSERT INTO public.review_disputes (
  id,
  case_id,
  field_id,
  original_value,
  disputed_by,
  reason,
  created_at,
  resolved_by,
  resolution,
  final_value,
  resolved_at
) VALUES (
  'ddd00001-0001-4001-8001-000000000001',
  '11111111-1111-4111-8111-111111111111',  -- Case 1: Ukraine article
  'content_type',
  '["nachrichtenartikel"]',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna
  'Dieser Artikel ist klar tendenziös und sollte als Meinungsbeitrag kategorisiert werden.',
  now() - interval '6 hours',
  NULL,  -- Not yet resolved
  NULL,
  NULL,
  NULL
);

-- ============================================
-- RESOLVED DISPUTES
-- ============================================

-- Dispute 2: Keyword Dispute on Case 1 - Admin Kept Original
-- Max suggested adding "NATO" keyword, but admin decided original keywords are sufficient
-- Status: Resolved (original_kept)
INSERT INTO public.review_disputes (
  id,
  case_id,
  field_id,
  original_value,
  disputed_by,
  reason,
  created_at,
  resolved_by,
  resolution,
  final_value,
  resolved_at
) VALUES (
  'ddd00002-0002-4002-8002-000000000002',
  '11111111-1111-4111-8111-111111111111',  -- Case 1: Ukraine article
  'keyword_type',
  '["Ukraine", "Russland", "Krieg", "Putin", "Zelensky"]',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max
  'Das Stichwort ''NATO'' fehlt komplett, obwohl es mehrfach im Artikel erwähnt wird.',
  now() - interval '1 day',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm (admin)
  'original_kept',
  '["Ukraine", "Russland", "Krieg", "Putin", "Zelensky"]',
  now() - interval '12 hours'
);

-- Dispute 3: Content Type Dispute on Case 2 - Admin Changed Value
-- Lisa disputed climate article categorization, admin agreed and changed to "opinion"
-- Status: Resolved (changed)
INSERT INTO public.review_disputes (
  id,
  case_id,
  field_id,
  original_value,
  disputed_by,
  reason,
  created_at,
  resolved_by,
  resolution,
  final_value,
  resolved_at
) VALUES (
  'ddd00003-0003-4003-8003-000000000003',
  '22222222-2222-4222-8222-222222222222',  -- Case 2: Climate article
  'content_type',
  '["nachrichtenartikel"]',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',  -- Lisa
  'Dies ist eindeutig ein Meinungsbeitrag, keine neutrale Nachricht.',
  now() - interval '2 days',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm (admin)
  'changed',
  '["opinion"]',
  now() - interval '1 day'
);

-- ============================================
-- Test Scenario Summary:
-- ============================================
--
-- This seed file creates 3 dispute scenarios:
--
-- 1. Unresolved Content Type Dispute (Case 1)
--    - Anna disputes "nachrichtenartikel" → suggests "opinion"
--    - Awaiting admin resolution
--    - Tests: Open dispute visibility, admin queue
--
-- 2. Resolved Keyword Dispute - Original Kept (Case 1)
--    - Max suggested adding "NATO" keyword
--    - Gorm (admin) decided to keep original keywords
--    - Tests: Resolution workflow, 'original_kept' resolution type
--
-- 3. Resolved Content Type Dispute - Changed (Case 2)
--    - Lisa disputed "nachrichtenartikel" → suggested "opinion"
--    - Gorm (admin) agreed and changed to "opinion"
--    - Tests: Resolution workflow, 'changed' resolution type
--
-- Important Notes:
-- - Only content_type and keyword_type fields are disputable (per template-modifier.ts)
-- - All values stored as JSONB arrays (e.g., '["nachrichtenartikel"]')
-- - Unique constraint prevents multiple open disputes on same field per case
-- - Resolved disputes show full audit trail (who, when, what decision)
-- ============================================
