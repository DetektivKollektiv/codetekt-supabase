import { z } from "npm:zod@4.1.13";

// Condition schemas for dynamic field behavior (is_disabled, is_required, is_shown, is_disputable)

const conditionValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const comparisonConditionSchema = z.object({
  field_id: z.string(),
  operator: z.union([z.literal(">"), z.literal("<")]),
  value: z.number(),
});

export const equalsConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("==="),
  value: conditionValueSchema,
});

export const inConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("in"),
  values: z.array(conditionValueSchema),
});

export const categoryInConditionSchema = z.object({
  context: z.literal("category"),
  operator: z.literal("in"),
  values: z.array(conditionValueSchema),
});

export const conditionSchema = z.union([
  comparisonConditionSchema,
  equalsConditionSchema,
  inConditionSchema,
  categoryInConditionSchema,
]);

export type Condition = z.infer<typeof conditionSchema>;
