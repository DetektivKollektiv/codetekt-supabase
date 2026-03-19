import { z } from "npm:zod@4.1.13";
import { trafficLightAnswerSchema } from "./answer-schemas.ts";

// Submitted review answer schema with all required fields and validation

export const submittedReviewAnswerSatireSchema = z
  .object({})
  .strict();

export const submittedReviewAnswerReportSchema = z
  .object({
    // Inhalt
    content_accuracy: trafficLightAnswerSchema,
    content_language: trafficLightAnswerSchema,
    content_objective_no_hate_no_panic: trafficLightAnswerSchema,
    content_headline_matches_article: trafficLightAnswerSchema,
    content_claims_not_debunked: trafficLightAnswerSchema,
    content_addtional_points: trafficLightAnswerSchema,

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema,
    medium_authenticity: trafficLightAnswerSchema,
    medium_additional_points: trafficLightAnswerSchema,

    // Quelle
    source_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_claims_match_originals: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema,
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
  })
  .strict();

export const submittedReviewAnswerOpinionSchema = z
  .object({
    // Inhalt
    content_language: trafficLightAnswerSchema,
    content_objective_no_hate_no_panic: trafficLightAnswerSchema,
    content_headline_matches_article: trafficLightAnswerSchema,
    content_claims_not_debunked: trafficLightAnswerSchema,
    content_addtional_points: trafficLightAnswerSchema,

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema,
    medium_authenticity: trafficLightAnswerSchema,
    medium_additional_points: trafficLightAnswerSchema,

    // Quelle
    source_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_claims_match_originals: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,

    // Zitate
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
  })
  .strict();

export const submittedReviewAnswerTextMessageSchema = z
  .object({
    // Inhalt
    content_language: trafficLightAnswerSchema,
    content_objective_no_hate_no_panic: trafficLightAnswerSchema,
    content_headline_matches_article: trafficLightAnswerSchema,
    content_claims_not_debunked: trafficLightAnswerSchema,
    content_addtional_points: trafficLightAnswerSchema,

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,

    // Quelle
    source_text_message_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_claims_match_originals: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema,
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
  })
  .strict();

// In-progress schema - all optional (autosave/draft)
export const inProgressReviewAnswerSchema = z
  .object({
    // Inhalt
    content_accuracy: trafficLightAnswerSchema.optional(),
    content_language: trafficLightAnswerSchema.optional(),
    content_objective_no_hate_no_panic: trafficLightAnswerSchema.optional(),
    content_headline_matches_article: trafficLightAnswerSchema.optional(),
    content_claims_not_debunked: trafficLightAnswerSchema.optional(),
    content_addtional_points: trafficLightAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema.optional(),
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema.optional(),
    media_visualizations_not_distorted: trafficLightAnswerSchema.optional(),
    media_addtional_points: trafficLightAnswerSchema.optional(),

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema.optional(),
    medium_authenticity: trafficLightAnswerSchema.optional(),
    medium_additional_points: trafficLightAnswerSchema.optional(),

    // Quelle
    source_author_expertise: trafficLightAnswerSchema.optional(),
    source_text_message_author_expertise: trafficLightAnswerSchema.optional(),
    source_claims_supported: trafficLightAnswerSchema.optional(),
    source_listed_and_verifiable: trafficLightAnswerSchema.optional(),
    source_claims_match_originals: trafficLightAnswerSchema.optional(),
    source_additional_points: trafficLightAnswerSchema.optional(),

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema.optional(),
    quotes_experts_reputation: trafficLightAnswerSchema.optional(),
    quotes_match_originals: trafficLightAnswerSchema.optional(),
    quotes_additional_points: trafficLightAnswerSchema.optional(),
  })
  .strict();

// Export types
export type SubmittedReviewAnswerSatire = z.infer<
  typeof submittedReviewAnswerSatireSchema
>;
export type SubmittedReviewAnswerReport = z.infer<
  typeof submittedReviewAnswerReportSchema
>;
export type SubmittedReviewAnswerOpinion = z.infer<
  typeof submittedReviewAnswerOpinionSchema
>;
export type SubmittedReviewAnswerTextMessage = z.infer<
  typeof submittedReviewAnswerTextMessageSchema
>;

export type InProgressReviewAnswer = z.infer<
  typeof inProgressReviewAnswerSchema
>;

export const submittedReviewAnswerSchemaMap = {
  report: submittedReviewAnswerReportSchema,
  opinion: submittedReviewAnswerOpinionSchema,
  satire: submittedReviewAnswerSatireSchema,
  text_message: submittedReviewAnswerTextMessageSchema,
} as const;

export type Category = keyof typeof submittedReviewAnswerSchemaMap;
