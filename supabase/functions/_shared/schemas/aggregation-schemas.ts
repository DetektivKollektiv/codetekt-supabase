import { z } from "npm:zod@4.1.13";
import { chipAnswerSchema, multyLineTextAnswerSchema } from "./answer-schemas.ts";

// Schema for aggregated field values
export const aggregationFieldValueSchema = z.object({
  counts: z.object({
    0: z.number(),
    1: z.number(),
    2: z.number(),
    3: z.number(),
  }),
  percentages: z.object({
    0: z.number(),
    1: z.number(),
    2: z.number(),
    3: z.number(),
  }),
  average: z.number(),
  warnings: z.array(z.string()),
});

// Review aggregation schema
export const reviewAggregationSchema = z.object({
  metadata: z.object({
    keywords: multyLineTextAnswerSchema,
    content_type: chipAnswerSchema,
  }),
  fields: z.record(z.string(), aggregationFieldValueSchema),
});

export type ReviewAggregationInput = z.infer<typeof reviewAggregationSchema>;
