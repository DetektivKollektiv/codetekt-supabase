import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multiLineTextAnswerSchema,
  textAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";

// Submitted review answer schema with all required fields and validation
export const submittedReviewAnswerSchema = z.object({
  title: textAnswerSchema,
  keyword_type: multiLineTextAnswerSchema,
  content_type: chipAnswerSchema,
  content_accuracy: trafficLightAnswerSchema,
  content_sources: trafficLightAnswerSchema,
  content_language: trafficLightAnswerSchema,
  content_clarity: trafficLightAnswerSchema,
  content_references: trafficLightAnswerSchema,
  content_logic: trafficLightAnswerSchema,
  content_advertising: trafficLightAnswerSchema,
  additional_rating: likertScaleAnswerSchema,
  additional_comment: textAreaAnswerSchema,
}).strict() // keine extra keys erlaubt
  .refine(
    (data) => {
      // Conditional: additional_comment required wenn additional_rating < 3
      if (
        data.additional_rating !== null &&
        data.additional_rating < 3
      ) {
        return data.additional_comment !== null &&
          data.additional_comment.trim().length > 0;
      }
      return true;
    },
    {
      message: "additional_comment is required when additional_rating < 3",
      path: ["additional_comment"],
    },
  );

// In-progress schema - all optional
export const inProgressReviewAnswerSchema = z.object({
  title: textAnswerSchema.optional(),
  keyword_type: multiLineTextAnswerSchema.optional(),
  content_type: chipAnswerSchema.optional(),
  content_accuracy: trafficLightAnswerSchema.optional(),
  content_sources: trafficLightAnswerSchema.optional(),
  content_language: trafficLightAnswerSchema.optional(),
  content_clarity: trafficLightAnswerSchema.optional(),
  content_references: trafficLightAnswerSchema.optional(),
  content_logic: trafficLightAnswerSchema.optional(),
  content_advertising: trafficLightAnswerSchema.optional(),
  additional_rating: likertScaleAnswerSchema.optional(),
  additional_comment: textAreaAnswerSchema.optional(),
}).strict();

// Export types
export type SubmittedReviewAnswer = z.infer<typeof submittedReviewAnswerSchema>;
export type InProgressReviewAnswer = z.infer<
  typeof inProgressReviewAnswerSchema
>;
