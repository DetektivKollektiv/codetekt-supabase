import { z } from "npm:zod@4.1.13";

export const WEDIUM_HASH_PATTERN = /^[0-9a-f]{64}$/;

export const wediumHashSchema = z.string().regex(
  WEDIUM_HASH_PATTERN,
  "Hash must contain exactly 64 lowercase hexadecimal characters",
);

export const WEDIUM_QUESTION_IDS = [
  "placeholder_question_1",
  "placeholder_question_2",
  "placeholder_question_3",
  "placeholder_question_4",
  "placeholder_question_5",
] as const;

export const wediumRatingValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const wediumAnswersSchema = z.object({
  placeholder_question_1: wediumRatingValueSchema,
  placeholder_question_2: wediumRatingValueSchema,
  placeholder_question_3: wediumRatingValueSchema,
  placeholder_question_4: wediumRatingValueSchema,
  placeholder_question_5: wediumRatingValueSchema,
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
