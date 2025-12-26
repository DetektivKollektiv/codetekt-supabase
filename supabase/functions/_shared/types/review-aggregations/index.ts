import { z } from "npm:zod@4.1.13";
import {
  aggregationFieldValueSchema,
  reviewAggregationSchema,
} from "../../schemas/aggregation-schemas.ts";

// Derive types from schemas (single source of truth)
export type ReviewAggregation = z.infer<typeof reviewAggregationSchema>;
export type AggregationFieldValue = z.infer<typeof aggregationFieldValueSchema>;
