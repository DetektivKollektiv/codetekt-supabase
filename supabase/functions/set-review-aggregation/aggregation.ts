import { z } from "npm:zod@4.1.13";
import {
  type AggregationFieldStats,
  reviewAggregationSchema,
} from "../_shared/schemas/aggregation-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import {
  DEFAULT_FIELD_TAGS,
  DEFAULT_QUESTION_ICONS,
  METADATA_QUESTION_IDS,
  SKIPPED_QUESTION_IDS,
} from "./aggregation-config.ts";

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
 * - Counts occurrences of each value (0-4 for traffic-light, 0-3 for likert-scale)
 * - Filters out traffic-light fields where ≥50% chose option 4 ("not applicable")
 * - Calculates percentages and averages (excluding option 4)
 * - Adds quality tags based on field type (0-3 only in output)
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @returns Fields object with aggregated statistics keyed by field_id (option 4 excluded from output)
 */
export function buildAggregationFields(
  submitted: SubmittedReview[],
): Record<string, AggregationFieldStats> {
  // Internal accumulator includes option 4 for filtering logic
  const fieldsInternal: Record<
    string,
    {
      counts: { 0: number; 1: number; 2: number; 3: number; 4: number };
      totalResponses: number;
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
      if (!fieldsInternal[fieldId]) {
        fieldsInternal[fieldId] = {
          counts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          totalResponses: 0,
        };
      }

      const field = fieldsInternal[fieldId];
      // Restrict to 0..4 as defined in AggregationFieldValue
      const bucket = Math.max(0, Math.min(4, value)) as 0 | 1 | 2 | 3 | 4;
      field.counts[bucket] += 1;
      field.totalResponses += 1;
    }
  }

  // Filter fields and build output (excluding option 4)
  const fields: Record<string, AggregationFieldStats> = {};

  for (const [fieldId, fieldData] of Object.entries(fieldsInternal)) {
    const { counts, totalResponses } = fieldData;

    // Calculate percentage of option 4 ("not applicable")
    const percentage4 = totalResponses > 0
      ? (counts[4] / totalResponses) * 100
      : 0;

    // Filter out fields where ≥50% chose option 4
    if (percentage4 >= 50) {
      continue; // Skip this field entirely
    }

    // Calculate total responses excluding option 4
    const totalExcludingOption4 = counts[0] + counts[1] + counts[2] + counts[3];

    // Build output for this field (without option 4)
    const outputCounts = {
      0: counts[0],
      1: counts[1],
      2: counts[2],
      3: counts[3],
    };
    const outputPercentages = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let average = 0;

    if (totalExcludingOption4 > 0) {
      // Calculate percentages (normalized to 100% without option 4)
      for (const key of [0, 1, 2, 3] as const) {
        outputPercentages[key] = (counts[key] / totalExcludingOption4) * 100;
      }

      // Calculate average (excluding option 4)
      const sum = counts[0] * 0 + counts[1] * 1 + counts[2] * 2 + counts[3] * 3;
      average = sum / totalExcludingOption4;
    }

    // Get tags (only 0-3)
    const fieldTags = DEFAULT_FIELD_TAGS[fieldId] || {
      0: "Sehr gut",
      1: "Gut",
      2: "Mangelhaft",
      3: "Ungenügend",
    };
    const outputTags = {
      0: fieldTags[0],
      1: fieldTags[1],
      2: fieldTags[2],
      3: fieldTags[3],
    };

    fields[fieldId] = {
      counts: outputCounts,
      percentages: outputPercentages,
      average,
      tags: outputTags,
    };
  }

  return fields;
}

/**
 * Builds aggregation for text fields from multiple submitted review answers.
 *
 * Aggregates text and text-area fields by collecting all non-null string answers.
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @param template - Review template to identify text/text-area fields
 * @returns Fields object with collected answer values keyed by field_id
 */
export function buildTextFields(
  submitted: SubmittedReview[],
  template: ReviewTemplateInput[],
): Record<string, { answer_values: string[] }> {
  // Build a set of text/text-area field IDs from template
  const textFieldIds = new Set<string>();
  for (const question of template) {
    for (const field of question.fields) {
      if (field.type === "text" || field.type === "text-area") {
        textFieldIds.add(field.id);
      }
    }
  }

  // Aggregate text answers
  const textFields: Record<string, { answer_values: string[] }> = {};

  for (const { data } of submitted) {
    const answerRecord = data as Record<string, unknown>;

    for (const [fieldId, value] of Object.entries(answerRecord)) {
      // Only aggregate text fields that are in the template
      if (!textFieldIds.has(fieldId)) continue;

      // Only include string values (skip null/undefined)
      if (typeof value !== "string") continue;

      // Initialize array if needed
      if (!textFields[fieldId]) {
        textFields[fieldId] = { answer_values: [] };
      }

      textFields[fieldId].answer_values.push(value);
    }
  }

  return textFields;
}

/**
 * Builds statistical aggregation from multiple submitted review answers.
 *
 * Explicit question handling:
 * 1. METADATA_QUESTION_IDS: Extracted separately for metadata (title, keywords, content_type)
 * 2. SKIPPED_QUESTION_IDS: Completely excluded from aggregation output
 * 3. Other questions: Aggregated with numeric field statistics
 *
 * Process:
 * - Extracts metadata (title from first answer, keyword_type merged, content_type from first answer)
 * - Applies resolved dispute overrides to metadata (admin's final values take precedence)
 * - Aggregates numeric fields with counts, percentages, averages, tags
 * - Organizes fields by questions matching template structure (excluding metadata and skipped questions)
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
  // Step 1: Extract metadata from metadata questions
  const metadata = buildAggregationMetadata(submitted, resolvedDisputes);

  // Step 2: Aggregate numeric fields from non-metadata, non-skipped questions
  const aggregatedFields = buildAggregationFields(submitted);

  // Step 3: Aggregate text fields from non-metadata, non-skipped questions
  const textFields = buildTextFields(submitted, template);

  // Step 4: Build questions array for aggregation (exclude metadata and skipped questions)
  const questions = template
    .filter((question) => {
      // Explicitly skip metadata questions (handled separately above)
      if (METADATA_QUESTION_IDS.includes(question.id)) return false;
      // Explicitly skip questions marked as skipped
      if (SKIPPED_QUESTION_IDS.includes(question.id)) return false;
      // Only include questions with fields
      return question.fields.length > 0;
    })
    .map((question) => {
      // Map fields to their aggregated data (numeric or text)
      const fields = question.fields
        .map((field) => {
          // Handle traffic-light fields (numeric)
          if (field.type === "traffic-light" && aggregatedFields[field.id]) {
            return {
              id: field.id,
              type: field.type,
              question: field.question,
              ...aggregatedFields[field.id],
            };
          }

          // Handle text/text-area fields
          if (
            (field.type === "text" || field.type === "text-area") &&
            textFields[field.id]
          ) {
            return {
              id: field.id,
              type: field.type,
              question: field.question,
              answer_values: textFields[field.id].answer_values,
            };
          }

          // Field has no aggregated data
          return null;
        })
        .filter((field) => field !== null);

      // Only return question if it has aggregated fields
      if (fields.length === 0) return null;

      // Calculate question score as the lowest average among numeric fields only
      const numericFields = fields.filter((f) => "average" in f);
      const questionScore = numericFields.length > 0
        ? Math.min(
          ...numericFields.map((f) => (f as { average: number }).average),
        )
        : 0;

      return {
        id: question.id,
        metadata: {
          ...question.metadata,
          icon: DEFAULT_QUESTION_ICONS[question.id],
        },
        fields,
        score: questionScore,
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
