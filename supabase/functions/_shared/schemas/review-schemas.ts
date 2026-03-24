import { z } from "npm:zod@4.1.13";
import {
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";

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
    content_additional_points_details: textAreaAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,
    media_additional_points_details: textAreaAnswerSchema.optional(),

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema,
    medium_authenticity: trafficLightAnswerSchema,
    medium_no_aggressive_ads_or_trackers: trafficLightAnswerSchema,
    medium_impressum: trafficLightAnswerSchema,
    medium_additional_points: trafficLightAnswerSchema,
    medium_additional_points_details: textAreaAnswerSchema.optional(),

    // Quelle
    source_article_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,
    source_additional_points_details: textAreaAnswerSchema.optional(),

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema,
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
    quotes_additional_points_details: textAreaAnswerSchema.optional(),
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
    content_additional_points_details: textAreaAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,
    media_additional_points_details: textAreaAnswerSchema.optional(),

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema,
    medium_authenticity: trafficLightAnswerSchema,
    medium_no_aggressive_ads_or_trackers: trafficLightAnswerSchema,
    medium_impressum: trafficLightAnswerSchema,
    medium_additional_points: trafficLightAnswerSchema,
    medium_additional_points_details: textAreaAnswerSchema.optional(),

    // Quelle
    source_article_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,
    source_additional_points_details: textAreaAnswerSchema.optional(),

    // Zitate
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
    quotes_additional_points_details: textAreaAnswerSchema.optional(),
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
    content_additional_points_details: textAreaAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema,
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema,
    media_visualizations_not_distorted: trafficLightAnswerSchema,
    media_addtional_points: trafficLightAnswerSchema,
    media_additional_points_details: textAreaAnswerSchema.optional(),

    // Quelle
    source_text_message_author_expertise: trafficLightAnswerSchema,
    source_claims_supported: trafficLightAnswerSchema,
    source_listed_and_verifiable: trafficLightAnswerSchema,
    source_additional_points: trafficLightAnswerSchema,
    source_additional_points_details: textAreaAnswerSchema.optional(),

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema,
    quotes_experts_reputation: trafficLightAnswerSchema,
    quotes_match_originals: trafficLightAnswerSchema,
    quotes_additional_points: trafficLightAnswerSchema,
    quotes_additional_points_details: textAreaAnswerSchema.optional(),
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
    content_additional_points_details: textAreaAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema.optional(),
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema.optional(),
    media_visualizations_not_distorted: trafficLightAnswerSchema.optional(),
    media_addtional_points: trafficLightAnswerSchema.optional(),
    media_additional_points_details: textAreaAnswerSchema.optional(),

    // Medium
    medium_independent_no_conflicts: trafficLightAnswerSchema.optional(),
    medium_authenticity: trafficLightAnswerSchema.optional(),
    medium_no_aggressive_ads_or_trackers: trafficLightAnswerSchema.optional(),
    medium_impressum: trafficLightAnswerSchema.optional(),
    medium_additional_points: trafficLightAnswerSchema.optional(),
    medium_additional_points_details: textAreaAnswerSchema.optional(),

    // Quelle
    source_article_author_expertise: trafficLightAnswerSchema.optional(),
    source_text_message_author_expertise: trafficLightAnswerSchema.optional(),
    source_claims_supported: trafficLightAnswerSchema.optional(),
    source_listed_and_verifiable: trafficLightAnswerSchema.optional(),
    source_additional_points: trafficLightAnswerSchema.optional(),
    source_additional_points_details: textAreaAnswerSchema.optional(),

    // Zitate
    quotes_identifiable_people: trafficLightAnswerSchema.optional(),
    quotes_experts_reputation: trafficLightAnswerSchema.optional(),
    quotes_match_originals: trafficLightAnswerSchema.optional(),
    quotes_additional_points: trafficLightAnswerSchema.optional(),
    quotes_additional_points_details: textAreaAnswerSchema.optional(),
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
