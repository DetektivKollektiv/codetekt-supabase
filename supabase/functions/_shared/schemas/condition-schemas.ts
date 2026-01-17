import { z } from "npm:zod@4.1.13";

// Condition schemas for dynamic field behavior (is_disabled, is_required, is_shown, is_disputable)

export const comparisonConditionSchema = z.object({
  field_id: z.string(),
  operator: z.union([z.literal(">"), z.literal("<")]),
  value: z.number(),
});

export const equalsConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("==="),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const inConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("in"),
  values: z.array(z.union([z.string(), z.number(), z.boolean()])),
});

export const conditionSchema = z.union([
  comparisonConditionSchema,
  equalsConditionSchema,
  inConditionSchema,
]);

export type Condition = z.infer<typeof conditionSchema>;
