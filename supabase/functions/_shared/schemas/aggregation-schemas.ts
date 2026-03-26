import { z } from "npm:zod@4.1.13";

// Schema for counts and percentages (reusable)
// Note: Option 4 ("not applicable") is filtered out before aggregation output
const countsSchema = z.object({
  0: z.number(),
  1: z.number(),
  2: z.number(),
  3: z.number(),
});

const percentagesSchema = z.object({
  0: z.number(),
  1: z.number(),
  2: z.number(),
  3: z.number(),
});

// Exported type for aggregated field statistics (reused in aggregation.ts)
export type AggregationFieldStats = {
  counts: { 0: number; 1: number; 2: number; 3: number };
  percentages: { 0: number; 1: number; 2: number; 3: number };
  average: number;
  tag: string;
};

// Schema for aggregated field values
export const baseAggregationValueSchema = z.object({
  id: z.string(),
  question: z.string(),
  tag: z.string().optional(),
});

// Schema for aggregated field values
export const aggregationTrafficLightValueSchema = baseAggregationValueSchema
  .extend({
    type: z.enum([
      "traffic-light",
    ]),
    counts: countsSchema,
    percentages: percentagesSchema,
    average: z.number(),
  });

export const aggregationTextFieldValueSchema = baseAggregationValueSchema
  .extend({
    type: z.enum([
      "text",
      "text-area",
    ]),
    answer_values: z.array(z.object({
      user_name: z.string(),
      value: z.string(),
    })),
  });

// Reuse the template metadata schema structure
const questionMetadataSchema = z.object({
  title: z.string(),
  text: z.string(),
  help_url: z.string(),
  indent_level: z.number().optional(),
  icon: z.string().optional(),
});

// Schema for aggregated question
export const aggregationQuestionSchema = z.object({
  id: z.string(),
  metadata: questionMetadataSchema,
  fields: z.array(
    z.union([
      aggregationTrafficLightValueSchema,
      aggregationTextFieldValueSchema,
    ]),
  ),
  score: z.number(),
});

// Review aggregation schema with new structure
export const reviewAggregationSchema = z.object({
  questions: z.array(aggregationQuestionSchema),
});

export type ReviewAggregationData = z.infer<typeof reviewAggregationSchema>;
