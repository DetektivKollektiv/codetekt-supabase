import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  multiLineTextAnswerSchema,
  textAnswerSchema,
} from "./answer-schemas.ts";

// Schema for counts and percentages (reusable)
const countsSchema = z.object({
  0: z.number(),
  1: z.number(),
  2: z.number(),
  3: z.number(),
  4: z.number(),
});

const percentagesSchema = z.object({
  0: z.number(),
  1: z.number(),
  2: z.number(),
  3: z.number(),
  4: z.number(),
});

// Schema for tags - maps value (0-4) to human-readable label
const tagsSchema = z.object({
  0: z.string(),
  1: z.string(),
  2: z.string(),
  3: z.string(),
  4: z.string(),
});

// Schema for aggregated field values
export const aggregationFieldValueSchema = z.object({
  id: z.string(),
  type: z.enum([
    "traffic-light",
    "likert-scale",
    "chip",
    "text",
    "text-area",
    "multi-line-text",
  ]),
  question: z.string(),
  counts: countsSchema,
  percentages: percentagesSchema,
  average: z.number(),
  tags: tagsSchema,
});

// Reuse the template metadata schema structure
const questionMetadataSchema = z.object({
  title: z.string(),
  text: z.string(),
  help_url: z.string(),
  indent_level: z.number().optional(),
});

// Schema for aggregated question
export const aggregationQuestionSchema = z.object({
  id: z.string(),
  metadata: questionMetadataSchema,
  fields: z.array(aggregationFieldValueSchema),
});

// Review aggregation schema with new structure
export const reviewAggregationSchema = z.object({
  questions: z.array(aggregationQuestionSchema),
  metadata: z.object({
    title: textAnswerSchema, // Case title from first reviewer
    keyword_type: multiLineTextAnswerSchema, // Aggregated keywords
    content_type: chipAnswerSchema, // Content type from first reviewer
  }),
});

export type ReviewAggregationInput = z.infer<typeof reviewAggregationSchema>;
