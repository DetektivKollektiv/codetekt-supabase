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

    // Inhalt
    content_accuracy: trafficLightAnswerSchema.optional(),
    content_sources: trafficLightAnswerSchema.optional(),
    content_language: trafficLightAnswerSchema.optional(),
    content_clarity: trafficLightAnswerSchema.optional(),
    content_references: trafficLightAnswerSchema.optional(),
    content_logic: trafficLightAnswerSchema.optional(),
    content_advertising: trafficLightAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema.optional(),
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema.optional(),
    media_no_obvious_editing: trafficLightAnswerSchema.optional(),
    media_visualizations_not_distorted: trafficLightAnswerSchema.optional(),
    media_visualization_data_traceable: trafficLightAnswerSchema.optional(),

    // Quelle
    source_claims_supported: trafficLightAnswerSchema.optional(),
    source_listed_and_verifiable: trafficLightAnswerSchema.optional(),
    source_claims_match_originals: trafficLightAnswerSchema.optional(),
    source_experts_verified: trafficLightAnswerSchema.optional(),
    quotes_experts_reputation: trafficLightAnswerSchema.optional(),

    // Zitate
    quotes_identifiable_persons: trafficLightAnswerSchema.optional(),
    quotes_context_accurate: trafficLightAnswerSchema.optional(),

    additional_rating: likertScaleAnswerSchema,
    additional_comment: z.string().min(10).nullable().optional(),
    comment: z.union([z.literal(""), z.string().min(10)]).nullable().optional(),
  })
  .strict() // keine extra keys erlaubt
  // -------------------------
  // Inhalt
  // -------------------------
  .refine(
    (data) => {
      // content_accuracy required when content_type === "neutral"
      if (data.content_type?.includes("neutral")) {
        return data.content_accuracy !== null &&
          data.content_accuracy !== undefined;
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
        return data.content_sources !== null &&
          data.content_sources !== undefined;
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
      // content_language required when content_type in ["neutral", "opinion", "text_message"]
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return data.content_language !== null &&
          data.content_language !== undefined;
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
        return data.content_clarity !== null &&
          data.content_clarity !== undefined;
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
        return data.content_references !== null &&
          data.content_references !== undefined;
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
        return data.content_advertising !== null &&
          data.content_advertising !== undefined;
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
  // -------------------------
  // Bilder/Videos
  // required when content_type in ["neutral", "opinion", "text_message"]
  // -------------------------
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return data.media_objectivity !== null &&
          data.media_objectivity !== undefined;
      }
      return true;
    },
    {
      message:
        "media_objectivity is required when content_type is neutral, opinion or text_message",
      path: ["media_objectivity"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "media_objectivity",
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
          data.media_no_ai_or_staging_doubts !== null &&
          data.media_no_ai_or_staging_doubts !== undefined
        );
      }
      return true;
    },
    {
      message:
        "media_no_ai_or_staging_doubts is required when content_type is neutral, opinion or text_message",
      path: ["media_no_ai_or_staging_doubts"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "media_no_ai_or_staging_doubts",
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
        return data.media_no_obvious_editing !== null &&
          data.media_no_obvious_editing !== undefined;
      }
      return true;
    },
    {
      message:
        "media_no_obvious_editing is required when content_type is neutral, opinion or text_message",
      path: ["media_no_obvious_editing"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "media_no_obvious_editing",
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
          data.media_visualizations_not_distorted !== null &&
          data.media_visualizations_not_distorted !== undefined
        );
      }
      return true;
    },
    {
      message:
        "media_visualizations_not_distorted is required when content_type is neutral, opinion or text_message",
      path: ["media_visualizations_not_distorted"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "media_visualizations_not_distorted",
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
          data.media_visualization_data_traceable !== null &&
          data.media_visualization_data_traceable !== undefined
        );
      }
      return true;
    },
    {
      message:
        "media_visualization_data_traceable is required when content_type is neutral, opinion or text_message",
      path: ["media_visualization_data_traceable"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "media_visualization_data_traceable",
        );
        return !hasRelevantIssues;
      },
    },
  )
  // -------------------------
  // Quelle
  // required when content_type in ["neutral", "opinion", "text_message"]
  // -------------------------
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) =>
          ["neutral", "opinion", "text_message"].includes(t)
        )
      ) {
        return data.source_claims_supported !== null &&
          data.source_claims_supported !== undefined;
      }
      return true;
    },
    {
      message:
        "source_claims_supported is required when content_type is neutral, opinion or text_message",
      path: ["source_claims_supported"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "source_claims_supported",
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
          data.source_listed_and_verifiable !== null &&
          data.source_listed_and_verifiable !== undefined
        );
      }
      return true;
    },
    {
      message:
        "source_listed_and_verifiable is required when content_type is neutral, opinion or text_message",
      path: ["source_listed_and_verifiable"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "source_listed_and_verifiable",
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
          data.source_claims_match_originals !== null &&
          data.source_claims_match_originals !== undefined
        );
      }
      return true;
    },
    {
      message:
        "source_claims_match_originals is required when content_type is neutral, opinion or text_message",
      path: ["source_claims_match_originals"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "source_claims_match_originals",
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
        return data.source_experts_verified !== null &&
          data.source_experts_verified !== undefined;
      }
      return true;
    },
    {
      message:
        "source_experts_verified is required when content_type is neutral, opinion or text_message",
      path: ["source_experts_verified"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "source_experts_verified",
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
        return data.quotes_experts_reputation !== null &&
          data.quotes_experts_reputation !== undefined;
      }
      return true;
    },
    {
      message:
        "quotes_experts_reputation is required when content_type is neutral, opinion or text_message",
      path: ["quotes_experts_reputation"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "quotes_experts_reputation",
        );
        return !hasRelevantIssues;
      },
    },
  )
  // -------------------------
  // Zitate
  // quotes_identifiable_persons required when content_type in ["neutral", "text_message"]
  // quotes_context_accurate required when content_type in ["neutral", "opinion", "text_message"]
  // -------------------------
  .refine(
    (data) => {
      if (
        data.content_type?.some((t) => ["neutral", "text_message"].includes(t))
      ) {
        return (
          data.quotes_identifiable_persons !== null &&
          data.quotes_identifiable_persons !== undefined
        );
      }
      return true;
    },
    {
      message:
        "quotes_identifiable_persons is required when content_type is neutral or text_message",
      path: ["quotes_identifiable_persons"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "quotes_identifiable_persons",
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
        return data.quotes_context_accurate !== null &&
          data.quotes_context_accurate !== undefined;
      }
      return true;
    },
    {
      message:
        "quotes_context_accurate is required when content_type is neutral, opinion or text_message",
      path: ["quotes_context_accurate"],
      when(payload) {
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "content_type" ||
            iss.path?.[0] === "quotes_context_accurate",
        );
        return !hasRelevantIssues;
      },
    },
  )
  // -------------------------
  // Additional
  // -------------------------
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
        const hasRelevantIssues = payload.issues.some(
          (iss) =>
            iss.path?.[0] === "additional_rating" ||
            iss.path?.[0] === "additional_comment",
        );
        return !hasRelevantIssues;
      },
    },
  );

// In-progress schema - all optional (autosave/draft)
export const inProgressReviewAnswerSchema = z
  .object({
    title: textAnswerSchema.optional(),
    keyword_type: multiLineTextAnswerSchema.optional(),
    content_type: chipAnswerSchema.optional(),

    // Inhalt
    content_accuracy: trafficLightAnswerSchema.optional(),
    content_sources: trafficLightAnswerSchema.optional(),
    content_language: trafficLightAnswerSchema.optional(),
    content_clarity: trafficLightAnswerSchema.optional(),
    content_references: trafficLightAnswerSchema.optional(),
    content_logic: trafficLightAnswerSchema.optional(),
    content_advertising: trafficLightAnswerSchema.optional(),

    // Bilder/Videos
    media_objectivity: trafficLightAnswerSchema.optional(),
    media_no_ai_or_staging_doubts: trafficLightAnswerSchema.optional(),
    media_no_obvious_editing: trafficLightAnswerSchema.optional(),
    media_visualizations_not_distorted: trafficLightAnswerSchema.optional(),
    media_visualization_data_traceable: trafficLightAnswerSchema.optional(),

    // Quelle
    source_claims_supported: trafficLightAnswerSchema.optional(),
    source_listed_and_verifiable: trafficLightAnswerSchema.optional(),
    source_claims_match_originals: trafficLightAnswerSchema.optional(),
    source_experts_verified: trafficLightAnswerSchema.optional(),

    // Zitate
    quotes_experts_reputation: trafficLightAnswerSchema.optional(),
    quotes_identifiable_persons: trafficLightAnswerSchema.optional(),
    quotes_context_accurate: trafficLightAnswerSchema.optional(),

    additional_rating: likertScaleAnswerSchema.optional(),
    additional_comment: textAreaAnswerSchema.optional(),
    comment: textAreaAnswerSchema.optional(),
  })
  .strict();

// Export types
export type SubmittedReviewAnswer = z.infer<typeof submittedReviewAnswerSchema>;
export type InProgressReviewAnswer = z.infer<
  typeof inProgressReviewAnswerSchema
>;
