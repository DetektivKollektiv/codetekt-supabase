import { z } from "npm:zod@4.1.13";
import { reviewAggregationSchema } from "../_shared/schemas/aggregation-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import { DEFAULT_FIELD_TAGS } from "./field-tags.ts";

export const numericLabeledValues = [0, 1, 2, 3, 4] as const;

export type AggregationResult = {
  aggregation: z.infer<typeof reviewAggregationSchema>;
  resultScore: number;
};

export type SubmittedReview = Pick<
  Database["public"]["Tables"]["review_answers_submitted"]["Row"],
  "data" | "reviewed_by"
>;

export type ResolvedDispute = Pick<
  Database["public"]["Tables"]["review_disputes"]["Row"],
  "field_id" | "final_value"
>;

/**
 * Extracts and aggregates metadata from submitted review answers.
 *
 * - Title: Taken from the first answer
 * - Keywords (keyword_type): Merges unique keywords from all reviews
 * - Content type: Taken from the first answer
 * - Resolved disputes: Admin's final_value overrides aggregated values
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @param resolvedDisputes - Optional array of resolved disputes with admin's final values
 * @returns Metadata object with title, keyword_type and content_type
 */
export function buildAggregationMetadata(
  submitted: SubmittedReview[],
  resolvedDisputes?: ResolvedDispute[],
): {
  title: string | null;
  keyword_type: string[] | null;
  content_type: string[] | null;
} {
  const firstData = submitted[0]?.data as Record<string, unknown> | undefined;

  // Merge keywords from all reviews
  const allKeywords = new Set<string>();
  for (const { data } of submitted) {
    const answerRecord = data as Record<string, unknown>;
    const keywords = answerRecord?.keyword_type as string[] | null | undefined;
    if (keywords && Array.isArray(keywords)) {
      keywords.forEach((keyword) => allKeywords.add(keyword));
    }
  }

  // Build aggregated values
  let finalTitle: string | null =
    (firstData?.title as string | null | undefined) ?? null;
  let finalKeywordType: string[] | null = allKeywords.size > 0
    ? Array.from(allKeywords)
    : null;
  let finalContentType: string[] | null =
    (firstData?.content_type as string[] | null | undefined) ?? null;

  // Apply resolved dispute overrides
  if (resolvedDisputes && resolvedDisputes.length > 0) {
    for (const dispute of resolvedDisputes) {
      if (!dispute.final_value) continue;

      try {
        const parsedValue = JSON.parse(dispute.final_value);

        if (dispute.field_id === "title" && typeof parsedValue === "string") {
          finalTitle = parsedValue;
        } else if (
          dispute.field_id === "keyword_type" && Array.isArray(parsedValue)
        ) {
          finalKeywordType = parsedValue;
        } else if (
          dispute.field_id === "content_type" && Array.isArray(parsedValue)
        ) {
          finalContentType = parsedValue;
        }
      } catch (error) {
        console.error(
          `Failed to parse final_value for dispute field_id="${dispute.field_id}":`,
          error,
        );
        // Fall back to aggregated value (already set above)
      }
    }
  }

  return {
    title: finalTitle,
    keyword_type: finalKeywordType,
    content_type: finalContentType,
  };
}

/**
 * Builds statistical aggregation for numeric fields from multiple submitted review answers.
 *
 * Aggregates numeric fields (traffic-light and likert-scale responses):
 * - Counts occurrences of each value (0-4)
 * - Calculates percentages
 * - Computes averages
 * - Adds quality tags based on field type
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @returns Fields object with aggregated statistics keyed by field_id
 */
export function buildAggregationFields(
  submitted: SubmittedReview[],
): Record<
  string,
  {
    counts: { 0: number; 1: number; 2: number; 3: number; 4: number };
    percentages: { 0: number; 1: number; 2: number; 3: number; 4: number };
    average: number;
    tags: { 0: string; 1: string; 2: string; 3: string; 4: string };
  }
> {
  const fields: Record<
    string,
    {
      counts: { 0: number; 1: number; 2: number; 3: number; 4: number };
      percentages: { 0: number; 1: number; 2: number; 3: number; 4: number };
      average: number;
      tags: { 0: string; 1: string; 2: string; 3: string; 4: string };
    }
  > = {};

  for (const { data } of submitted) {
    const answerRecord = data as Record<string, unknown>;

    for (const [fieldId, value] of Object.entries(answerRecord)) {
      // Only aggregate numeric answers (traffic-light / likert)
      if (
        typeof value !== "number" ||
        !numericLabeledValues.includes(
          value as (typeof numericLabeledValues)[number],
        )
      ) {
        continue;
      }

      // Initialize accumulator
      if (!fields[fieldId]) {
        fields[fieldId] = {
          counts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          percentages: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          average: 0,
          tags: DEFAULT_FIELD_TAGS[fieldId] || {
            0: "Sehr gut",
            1: "Gut",
            2: "Mangelhaft",
            3: "Ungenügend",
            4: "Nicht zutreffend",
          },
        };
      }

      const field = fields[fieldId];
      // Restrict to 0..4 as defined in AggregationFieldValue
      const bucket = Math.max(0, Math.min(4, value)) as 0 | 1 | 2 | 3 | 4;
      field.counts[bucket] += 1;
    }
  }

  // Calculate percentages and averages
  for (const field of Object.values(fields)) {
    const total = numericLabeledValues.reduce<number>(
      (sum, key) => sum + field.counts[key],
      0,
    );
    if (total > 0) {
      for (const key of numericLabeledValues) {
        field.percentages[key] = (field.counts[key] / total) * 100;
      }
      const sum = numericLabeledValues.reduce<number>(
        (s, key) => s + field.counts[key] * key,
        0,
      );
      field.average = sum / total;
    }
  }

  return fields;
}

/**
 * Builds statistical aggregation from multiple submitted review answers.
 *
 * Combines metadata extraction and field aggregation:
 * - Extracts metadata (title from first answer, keyword_type merged, content_type from first answer)
 * - Applies resolved dispute overrides to metadata (admin's final values take precedence)
 * - Aggregates numeric fields with counts, percentages, averages, tags
 * - Organizes fields by questions matching template structure
 * - Computes overall result score
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @param template - Review template to match structure and get metadata
 * @param resolvedDisputes - Optional array of resolved disputes with admin's final values
 * @returns Aggregation object and result score
 */
export function buildAggregation(
  submitted: SubmittedReview[],
  template: ReviewTemplateInput[],
  resolvedDisputes?: ResolvedDispute[],
): AggregationResult {
  const metadata = buildAggregationMetadata(submitted, resolvedDisputes);
  const aggregatedFields = buildAggregationFields(submitted);

  // Build questions array matching template structure
  const questions = template
    .filter((question) => question.fields.length > 0) // Only include questions with fields
    .map((question) => {
      // Filter fields that have aggregated data (numeric fields only)
      const fields = question.fields
        .filter((field) => aggregatedFields[field.id])
        .map((field) => ({
          id: field.id,
          type: field.type,
          question: field.question,
          ...aggregatedFields[field.id],
        }));

      // Only return question if it has aggregated fields
      if (fields.length === 0) return null;

      return {
        id: question.id,
        metadata: question.metadata,
        fields,
      };
    })
    .filter((q) => q !== null); // Remove questions with no aggregated fields

  const averages = Object.values(aggregatedFields).map((f) => f.average);
  const resultScore = averages.length ? Math.min(...averages) : 0;

  return {
    aggregation: {
      questions,
      metadata,
    },
    resultScore,
  };
}
