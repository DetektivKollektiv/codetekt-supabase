-- ============================================
-- SEED: Published Review Aggregations
-- Publishes the MDR case for local test data
-- ============================================

INSERT INTO public.review_aggregations (
  case_id,
  result_score,
  data,
  reviewer_ids,
  calculated_at
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  3.00,
  '{"questions":[]}'::jsonb,
  ARRAY[
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  ],
  now()
);
