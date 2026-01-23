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
export const submittedReviewAnswerSchema = z
  .object({
    title: z.string().min(10).nullable(),
    keyword_type: z.array(z.string().min(3)).min(1).nullable(),
    content_type: chipAnswerSchema,
    content_accuracy: trafficLightAnswerSchema.optional(),
    content_sources: trafficLightAnswerSchema.optional(),
    content_language: trafficLightAnswerSchema.optional(),
    content_clarity: trafficLightAnswerSchema.optional(),
    content_references: trafficLightAnswerSchema.optional(),
    content_logic: trafficLightAnswerSchema.optional(),
    content_advertising: trafficLightAnswerSchema.optional(),
    additional_rating: likertScaleAnswerSchema,
    additional_comment: z.string().min(10).nullable().optional(),
    comment: z
      .union([z.literal(""), z.string().min(10)])
      .nullable()
      .optional(),
  })
  .strict() // keine extra keys erlaubt
  .refine(
    (data) => {
      // content_accuracy required when content_type === "neutral"
      if (data.content_type?.includes("neutral")) {
        return (
          data.content_accuracy !== null && data.content_accuracy !== undefined
        );
      }
      return true;
    },
    {
      message: "content_accuracy is required when content_type is neutral",
      path: ["content_accuracy"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_accuracy",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      // content_sources required when content_type in ["neutral", "opinion"]
      if (data.content_type?.some((t) => ["neutral", "opinion"].includes(t))) {
        return (
          data.content_sources !== null && data.content_sources !== undefined
        );
      }
      return true;
    },
    {
      message:
        "content_sources is required when content_type is neutral or opinion",
      path: ["content_sources"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_sources",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      // content_language, content_clarity, content_references, content_logic, content_advertising
      // required when content_type in ["neutral", "opinion", "text_message"]
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return (
          data.content_language !== null && data.content_language !== undefined
        );
      }
      return true;
    },
    {
      message:
        "content_language is required when content_type is neutral, opinion or text_message",
      path: ["content_language"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_language",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return (
          data.content_clarity !== null && data.content_clarity !== undefined
        );
      }
      return true;
    },
    {
      message:
        "content_clarity is required when content_type is neutral, opinion or text_message",
      path: ["content_clarity"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_clarity",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return (
          data.content_references !== null &&
          data.content_references !== undefined
        );
      }
      return true;
    },
    {
      message:
        "content_references is required when content_type is neutral, opinion or text_message",
      path: ["content_references"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_references",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return data.content_logic !== null && data.content_logic !== undefined;
      }
      return true;
    },
    {
      message:
        "content_logic is required when content_type is neutral, opinion or text_message",
      path: ["content_logic"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_logic",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return (
          data.content_advertising !== null &&
          data.content_advertising !== undefined
        );
      }
      return true;
    },
    {
      message:
        "content_advertising is required when content_type is neutral, opinion or text_message",
      path: ["content_advertising"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "content_advertising",
        );
        return !hasRelevantIssues;
      },
    },
  )
  .refine(
    (data) => {
      // Conditional: additional_comment required wenn additional_rating < 3
      if (data.additional_rating !== null && data.additional_rating < 3) {
        return (
          data.additional_comment !== null &&
          data.additional_comment !== undefined &&
          data.additional_comment.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "additional_comment is required when additional_rating < 3",
      path: ["additional_comment"],
      when(payload) {
        // Only run this refinement if both fields we care about have no issues
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "additional_rating" ||
            iss.path?.[0] === "additional_comment",
        );
        return !hasRelevantIssues;
      },
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
  comment: textAreaAnswerSchema.optional(),
}).strict();

// Export types
export type SubmittedReviewAnswer = z.infer<typeof submittedReviewAnswerSchema>;
export type InProgressReviewAnswer = z.infer<
  typeof inProgressReviewAnswerSchema
>;
