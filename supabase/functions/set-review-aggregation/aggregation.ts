import { z } from "npm:zod@4.1.13";
import {
  type AggregationFieldStats,
  reviewAggregationSchema,
} from "../_shared/schemas/aggregation-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import {
  DEFAULT_FIELD_TAG,
  FIELD_TAGS,
  QUESTION_ICONS,
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

type AggregatedTextAnswer = {
  user_name: string;
  value: string;
};

/**
 * Extracts field IDs that should be aggregated from the review template.
 * Returns Set of traffic-light field IDs, excluding metadata and skipped questions.
 *
 * @param template - Review template to extract field IDs from
 * @returns Set of valid traffic-light field IDs
 */
export function extractAggregableFieldIds(
  template: ReviewTemplateInput[],
): Set<string> {
  const validFieldIds = new Set<string>();

  for (const question of template) {
    // Skip questions marked as skipped
    if (SKIPPED_QUESTION_IDS.includes(question.id)) continue;

    // Collect traffic-light field IDs
    for (const field of question.fields) {
      if (field.type === "traffic-light") {
        validFieldIds.add(field.id);
      }
    }
  }

  return validFieldIds;
}

/**
 * Builds statistical aggregation for numeric fields from multiple submitted review answers.
 *
 * Aggregates only traffic-light fields provided in validFieldIds:
 * - Counts occurrences of each value (0-4)
 * - Filters out fields where ≥50% chose option 4 ("not applicable")
 * - Calculates percentages and averages (excluding option 4)
 * - Adds quality tags based on field type (0-3 only in output)
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @param validFieldIds - Set of traffic-light field IDs to aggregate (pre-filtered by template)
 * @returns Fields object with aggregated statistics keyed by field_id (option 4 excluded from output)
 */
export function buildAggregationFields(
  submitted: SubmittedReview[],
  validFieldIds: Set<string>,
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
      // Only aggregate valid traffic-light fields
      if (!validFieldIds.has(fieldId)) continue;

      // Only aggregate numeric answers
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

    // Choose one output tag by value bucket: 0 vs 1,2,3
    const fieldTags = FIELD_TAGS[fieldId] || DEFAULT_FIELD_TAG;

    // For now, we will show the text of the tag for 0 only, and show the correct color
    // const selectedBucket = Math.ceil(average) === 0 ? "value0" : "value1_2_3";
    const selectedBucket = "value0";

    fields[fieldId] = {
      counts: outputCounts,
      percentages: outputPercentages,
      average,
      tag: fieldTags[selectedBucket],
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
  usernameByReviewerId: Map<string, string>,
): Record<string, { answer_values: AggregatedTextAnswer[] }> {
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
  const textFields: Record<string, { answer_values: AggregatedTextAnswer[] }> =
    {};

  for (const { data, reviewed_by } of submitted) {
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

      textFields[fieldId].answer_values.push({
        user_name: usernameByReviewerId.get(reviewed_by) ?? "Unbekannt",
        value,
      });
    }
  }

  return textFields;
}

/**
 * Builds statistical aggregation from multiple submitted review answers.
 *
 * Explicit question handling:
 * 1. SKIPPED_QUESTION_IDS: Completely excluded from aggregation output
 * 2. Other questions: Aggregated with numeric field statistics
 *
 * Process:
 * - Aggregates numeric fields with counts, percentages, averages, tags
 * - Organizes fields by questions matching template structure (excluding skipped questions)
 * - Computes overall result score
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @param template - Review template to match structure and get metadata
 * @returns Aggregation object and result score
 */
export function buildAggregation(
  submitted: SubmittedReview[],
  template: ReviewTemplateInput[],
  usernameByReviewerId: Map<string, string>,
): AggregationResult {
  // Step 1: Extract valid traffic-light field IDs from template
  const validFieldIds = extractAggregableFieldIds(template);

  // Step 2: Aggregate traffic-light fields
  const aggregatedFields = buildAggregationFields(submitted, validFieldIds);

  // Step 3: Aggregate text fields
  const textFields = buildTextFields(
    submitted,
    template,
    usernameByReviewerId,
  );

  // Step 4: Build questions array for aggregation (excluding skipped questions)
  const questions = template
    .filter((question) => {
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
        ? Math.max(
          ...numericFields.map((f) => (f as { average: number }).average),
        )
        : 0;

      return {
        id: question.id,
        metadata: {
          ...question.metadata,
          icon: QUESTION_ICONS[question.id],
        },
        fields,
        score: questionScore,
      };
    })
    .filter((q) => q !== null); // Remove questions with no aggregated fields

  const averages = Object.values(aggregatedFields).map((f) => f.average);
  const resultScore = averages.length ? Math.max(...averages) : 0;

  return {
    aggregation: {
      questions,
    },
    resultScore,
  };
}
