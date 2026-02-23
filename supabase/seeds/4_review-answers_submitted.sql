-- ============================================
-- SEED: Additional Submitted Reviews (2 per case) - UPDATED FOR TEMPLATE v1+
-- Only: public.review_answers_submitted
-- Scale: 0 (gut) .. 3 (schlecht), (4=nicht bewertbar)
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
    "content_references": 3,
    "content_logic": 0,
    "content_advertising": 1,
    "content_rhetorical_manipulation": 0,
    "content_objective_no_hate_no_panic": 0,
    "content_headline_matches_article": 1,
    "content_claims_not_debunked": 0,

    "media_objectivity": 3,
    "media_no_ai_or_staging_doubts": 3,
    "media_no_obvious_editing": 3,
    "media_visualizations_not_distorted": 3,
    "media_visualization_data_traceable": 3,

    "source_claims_supported": 1,
    "source_listed_and_verifiable": 1,
    "source_claims_match_originals": 2,
    "source_experts_verified": 3,

    "quotes_experts_reputation": 3,
    "quotes_identifiable_persons": 3,
    "quotes_context_accurate": 3,

    "additional_rating": 1,
    "additional_comment": "Wirkt insgesamt sauber, aber Überschrift etwas zugespitzt.",

    "comment": "Die Quelle ist seriös und die Fakten scheinen korrekt zu sein."
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
    "content_clarity": 3,
    "content_references": 0,
    "content_logic": 1,
    "content_advertising": 2,
    "content_rhetorical_manipulation": 1,
    "content_objective_no_hate_no_panic": 1,
    "content_headline_matches_article": 2,
    "content_claims_not_debunked": 1,

    "media_objectivity": 3,
    "media_no_ai_or_staging_doubts": 3,
    "media_no_obvious_editing": 3,
    "media_visualizations_not_distorted": 3,
    "media_visualization_data_traceable": 3,

    "source_claims_supported": 2,
    "source_listed_and_verifiable": 2,
    "source_claims_match_originals": 2,
    "source_experts_verified": 3,

    "quotes_experts_reputation": 3,
    "quotes_identifiable_persons": 3,
    "quotes_context_accurate": 3,

    "additional_rating": 2,
    "additional_comment": "Wirkt insgesamt sauber, aber Überschrift etwas zugespitzt.",

    "comment": "Die Quelle ist seriös und die Fakten scheinen korrekt zu sein."
  }'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
)
;