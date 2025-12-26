import { z } from "npm:zod@4.1.13";
import { reviewAggregationSchema } from "./schemas/aggregation-schemas.ts";

export const numericLabeledValues = [0, 1, 2, 3] as const;

export type AggregationResult = {
  aggregation: z.infer<typeof reviewAggregationSchema>;
  resultScore: number;
};

export type SubmittedAnswer = {
  data: unknown;
  reviewed_by: string;
};

/**
 * Builds statistical aggregation from multiple submitted review answers.
 *
 * Aggregates numeric fields (traffic-light and likert-scale responses):
 * - Counts occurrences of each value (0-3)
 * - Calculates percentages
 * - Computes averages
 * - Identifies warnings (average < 2)
 * - Computes overall result score
 *
 * @param submitted - Array of submitted review answers with data and reviewer_id
 * @returns Aggregation object and result score
 */
export function buildAggregation(
  submitted: SubmittedAnswer[],
): AggregationResult {
  const fields: Record<
    string,
    {
      counts: { 0: number; 1: number; 2: number; 3: number };
      percentages: { 0: number; 1: number; 2: number; 3: number };
      average: number;
      warnings: string[];
    }
  > = {};

  // Collect metadata from first answer if present
  const firstData = submitted[0]?.data as Record<string, unknown> | undefined;
  const metadata = {
    keywords: (firstData?.keywords as string[] | null | undefined) ?? null,
    content_type: (firstData?.content_type as string[] | null | undefined) ??
      null,
  };

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
          counts: { 0: 0, 1: 0, 2: 0, 3: 0 },
          percentages: { 0: 0, 1: 0, 2: 0, 3: 0 },
          average: 0,
          warnings: [],
        };
      }

      const field = fields[fieldId];
      // Restrict to 0..3 as defined in AggregationFieldValue
      const bucket = Math.max(0, Math.min(3, value)) as 0 | 1 | 2 | 3;
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
      if (field.average < 2) {
        field.warnings.push("Warning");
      }
    }
  }

  const averages = Object.values(fields).map((f) => f.average);
  const resultScore = averages.length
    ? averages.reduce<number>((sum, v) => sum + v, 0) / averages.length
    : 0;

  return {
    aggregation: {
      metadata,
      fields,
    },
    resultScore,
  };
}
