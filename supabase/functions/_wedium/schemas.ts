import { z } from "npm:zod@4.1.13";

export const WEDIUM_HASH_PATTERN = /^[0-9a-f]{64}$/;

export const wediumHashSchema = z.string().regex(
  WEDIUM_HASH_PATTERN,
  "Hash must contain exactly 64 lowercase hexadecimal characters",
);

export const WEDIUM_QUESTION_IDS = [
  "content_false_context",
  "content_contradictory",
  "content_covert_advertising",
  "content_clickbait",
  "content_deepfake",
  "presentation_derogatory",
  "presentation_aggressive",
  "presentation_fear_inducing",
  "presentation_generalizing",
  "account_biased",
  "account_unclear_identity",
  "account_impersonated_identity",
  "sources_unreliable",
  "sources_debunked",
  "sources_missing",
] as const;

export const wediumRatingValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const wediumAnswersSchema = z.object({
  content_false_context: wediumRatingValueSchema,
  content_contradictory: wediumRatingValueSchema,
  content_covert_advertising: wediumRatingValueSchema,
  content_clickbait: wediumRatingValueSchema,
  content_deepfake: wediumRatingValueSchema,
  presentation_derogatory: wediumRatingValueSchema,
  presentation_aggressive: wediumRatingValueSchema,
  presentation_fear_inducing: wediumRatingValueSchema,
  presentation_generalizing: wediumRatingValueSchema,
  account_biased: wediumRatingValueSchema,
  account_unclear_identity: wediumRatingValueSchema,
  account_impersonated_identity: wediumRatingValueSchema,
  sources_unreliable: wediumRatingValueSchema,
  sources_debunked: wediumRatingValueSchema,
  sources_missing: wediumRatingValueSchema,
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
