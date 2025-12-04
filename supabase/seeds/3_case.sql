-- ============================================
-- SEED: Test Cases
-- Voraussetzung: User (gorm-labenz@hotmail.com) und review_templates (v1) existieren
-- ============================================

-- Case 1: URL-basierter Artikel über Ukraine-Krieg
INSERT INTO public.cases (
  id,
  submitted_by,
  content,
  content_type,
  submitted_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  'https://example.com/artikel/ukraine-russland-konflikt-aktuell',
  'url',
  now() - interval '2 days'
);

-- Case 2: Text-basierte Social Media Behauptung
INSERT INTO public.cases (
  id,
  submitted_by,
  content,
  content_type,
  submitted_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  'Die Regierung verschweigt die wahren Inflationszahlen! Laut meiner Recherche liegt die echte Inflation bei über 20%. Teilt das bevor es gelöscht wird!',
  'text',
  now() - interval '1 day'
);

-- template_version wird automatisch durch on_case_created Trigger gesetzt (max version)