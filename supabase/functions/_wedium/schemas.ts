import { z } from "npm:zod@4.1.13";

export const WEDIUM_HASH_PATTERN = /^[0-9a-f]{64}$/;

export const wediumHashSchema = z.string().regex(
  WEDIUM_HASH_PATTERN,
  "Hash must contain exactly 64 lowercase hexadecimal characters",
);

export const WEDIUM_QUESTION_IDS = [
  "content_manipulated_or_deepfake",
  "content_false_context",
  "content_missing_context",
  "content_advertising",
  "content_one_sided",
  "content_illogical_or_contradictory",
  "content_clickbait",
  "tone_emotionalized",
  "tone_inflammatory",
  "tone_distracting",
  "tone_generalizing",
  "tone_polarizing",
  "account_anonymous",
  "account_unreliable",
  "account_not_objective",
  "account_not_independent",
  "external_sources_missing",
  "external_sources_not_verifiable",
  "external_sources_false_context",
  "external_sources_forged",
  "external_sources_missing_context",
  "external_sources_not_expert",
  "external_sources_factually_incorrect",
  "external_sources_heavily_abridged",
] as const;

export const wediumRatingValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const wediumAnswersSchema = z.object({
  content_manipulated_or_deepfake: wediumRatingValueSchema,
  content_false_context: wediumRatingValueSchema,
  content_missing_context: wediumRatingValueSchema,
  content_advertising: wediumRatingValueSchema,
  content_one_sided: wediumRatingValueSchema,
  content_illogical_or_contradictory: wediumRatingValueSchema,
  content_clickbait: wediumRatingValueSchema,
  tone_emotionalized: wediumRatingValueSchema,
  tone_inflammatory: wediumRatingValueSchema,
  tone_distracting: wediumRatingValueSchema,
  tone_generalizing: wediumRatingValueSchema,
  tone_polarizing: wediumRatingValueSchema,
  account_anonymous: wediumRatingValueSchema,
  account_unreliable: wediumRatingValueSchema,
  account_not_objective: wediumRatingValueSchema,
  account_not_independent: wediumRatingValueSchema,
  external_sources_missing: wediumRatingValueSchema,
  external_sources_not_verifiable: wediumRatingValueSchema,
  external_sources_false_context: wediumRatingValueSchema,
  external_sources_forged: wediumRatingValueSchema,
  external_sources_missing_context: wediumRatingValueSchema,
  external_sources_not_expert: wediumRatingValueSchema,
  external_sources_factually_incorrect: wediumRatingValueSchema,
  external_sources_heavily_abridged: wediumRatingValueSchema,
}).strict();

export const putWediumReviewBodySchema = z.object({
  answers: wediumAnswersSchema,
}).strict();

export const wediumAggregationRequestSchema = z.object({
  post_hashes: z.array(wediumHashSchema).min(1).max(100),
}).strict().superRefine(({ post_hashes }, context) => {
  const seen = new Set<string>();

  post_hashes.forEach((postHash, index) => {
    if (seen.has(postHash)) {
      context.addIssue({
        code: "custom",
        message: "Duplicate post hashes are not allowed",
        path: ["post_hashes", index],
      });
    }
    seen.add(postHash);
  });
});

export const wediumAggregationWorkerRequestSchema = z.object({
  post_id: z.string().uuid(),
}).strict();

export type WediumAnswers = z.infer<typeof wediumAnswersSchema>;
export type WediumQuestionId = (typeof WEDIUM_QUESTION_IDS)[number];
