import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multiLineTextAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";

// Submitted review answer schema with all required fields and validation
export const submittedReviewAnswerSchema = z.object({
  keyword_type: multiLineTextAnswerSchema,
  content_type: chipAnswerSchema,
  grammar: trafficLightAnswerSchema,
  structure: trafficLightAnswerSchema,
  headline: trafficLightAnswerSchema,
  objectivity: trafficLightAnswerSchema,
  perspectives: trafficLightAnswerSchema,
  external_sources: trafficLightAnswerSchema,
  claims_match_sources: trafficLightAnswerSchema,
  public_media_match: trafficLightAnswerSchema,
  author_credentials: trafficLightAnswerSchema,
  images_quality: trafficLightAnswerSchema,
  additional_rating: likertScaleAnswerSchema,
  additional_comment: textAreaAnswerSchema,
}).strict() // keine extra keys erlaubt
  .refine(
    (data) => {
      // Conditional: additional_comment required wenn additional_rating < 4
      if (
        data.additional_rating !== null &&
        data.additional_rating < 4
      ) {
        return data.additional_comment !== null &&
          data.additional_comment.trim().length > 0;
      }
      return true;
    },
    {
      message: "additional_comment is required when additional_rating < 4",
      path: ["additional_comment"],
    },
  );

// In-progress schema - all optional
export const inProgressReviewAnswerSchema = z.object({
  keyword_type: multiLineTextAnswerSchema.optional(),
  content_type: chipAnswerSchema.optional(),
  grammar: trafficLightAnswerSchema.optional(),
  structure: trafficLightAnswerSchema.optional(),
  headline: trafficLightAnswerSchema.optional(),
  objectivity: trafficLightAnswerSchema.optional(),
  perspectives: trafficLightAnswerSchema.optional(),
  external_sources: trafficLightAnswerSchema.optional(),
  claims_match_sources: trafficLightAnswerSchema.optional(),
  public_media_match: trafficLightAnswerSchema.optional(),
  author_credentials: trafficLightAnswerSchema.optional(),
  images_quality: trafficLightAnswerSchema.optional(),
  additional_rating: likertScaleAnswerSchema.optional(),
  additional_comment: textAreaAnswerSchema.optional(),
}).strict();

// Export types
export type SubmittedReviewAnswer = z.infer<typeof submittedReviewAnswerSchema>;
export type InProgressReviewAnswer = z.infer<
  typeof inProgressReviewAnswerSchema
>;
