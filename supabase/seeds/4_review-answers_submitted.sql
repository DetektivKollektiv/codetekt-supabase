-- ============================================
-- SEED: Additional Submitted Reviews (2 per case)
-- Only: public.review_answers_submitted
-- Scale: 0 (gut) .. 3 (schlecht)
-- Sonderfall: "content_type" nur im jeweils 1. Review pro Case
-- Reviewer: Gorm (1. Review) + Anna (2. Review)
-- ============================================

INSERT INTO public."review_answers_submitted"
(id, case_id, reviewed_by, data, created_at, submitted_at, updated_at)
VALUES

-- =========================================================
-- URL CASES (10) -> 20 reviews
-- =========================================================

-- 1) Case: MDR (1111...)
(
  '8a7c1c7e-7b85-4b98-9e2a-1f98b4a9a1c1',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "title": "MDR: Tschechien schickt Botschafter aus Russland zurück",
    "keyword_type": ["Ukraine", "Russland", "Tschechien", "Botschafter", "Propaganda"],
    "content_type": ["neutral"],

    "content_accuracy": 0,
    "content_sources": 1,
    "content_language": 2,
    "content_clarity": 3,
    "content_references": 4,
    "content_logic": 0,
    "content_advertising": 1,

    "additional_rating": 1,
    "additional_comment": "Wirkt insgesamt sauber, aber Überschrift etwas zugespitzt."
  }'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days',
  now() - interval '6 days'
),
(
  'f1d6e9c5-3d90-4e8d-bc70-6b8b5a2d8c91',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "title": "MDR: Tschechien schickt Botschafter aus Russland zurück",
    "keyword_type": ["Ukraine", "Russland", "Tschechien", "Botschafter", "Propaganda"],
    "content_type": ["neutral"],
    
    "content_accuracy": 1,
    "content_sources": 2,
    "content_language": 3,
    "content_clarity": 4,
    "content_references": 0,
    "content_logic": 1,
    "content_advertising": 2,

    "additional_rating": 2,
    "additional_comment": "Wirkt insgesamt sauber, aber Überschrift etwas zugespitzt."
  }'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
)
;