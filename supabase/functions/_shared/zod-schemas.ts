import { z } from "npm:zod@4.1.13";

// Answer value schemas
export const multyLineTextAnswerSchema = z.array(z.string()).nullable();
export const chipAnswerSchema = z.array(z.string()).nullable();
export const trafficLightAnswerSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .nullable();
export const likertScaleAnswerSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
  .nullable();
export const textAreaAnswerSchema = z.string().nullable();

// review-answers
export const reviewAnswerSchema = z.record(
  z.string(),
  z.union([
    multyLineTextAnswerSchema,
    chipAnswerSchema,
    trafficLightAnswerSchema,
    likertScaleAnswerSchema,
    textAreaAnswerSchema,
  ]),
);

export type ReviewAnswerInput = z.infer<typeof reviewAnswerSchema>;

// review-aggregations
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

export const reviewAggregationSchema = z.object({
  metadata: z.object({
    keywords: multyLineTextAnswerSchema,
    content_type: chipAnswerSchema,
  }),
  fields: z.record(z.string(), aggregationFieldValueSchema),
});

export type ReviewAggregationInput = z.infer<typeof reviewAggregationSchema>;

// review-templates
export const hasAnswerConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("has_answer"),
});

export const comparisonConditionSchema = z.object({
  field_id: z.string(),
  operator: z.union([z.literal(">"), z.literal("<")]),
  value: z.number(),
});

export const equalsConditionSchema = z.object({
  field_id: z.string(),
  operator: z.literal("equals"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const conditionSchema = z.union([
  hasAnswerConditionSchema,
  comparisonConditionSchema,
  equalsConditionSchema,
]);

export type ConditionInput = z.infer<typeof conditionSchema>;

export const chipOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const traficLightOptionSchema = z.object({
  id: z.string(),
  question: z.string(),
});

export const likertScaleOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
  color: z.string(),
  value: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});

export const textAreaOptionSchema = z.object({
  id: z.string(),
  placeholder: z.string(),
  max_length: z.number(),
});

export const multiLineTextOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_disabled: z.boolean(),
});

export const baseFieldSchema = z.object({
  id: z.string(),
  is_disabled: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_required: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_shown: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_disputable: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
});

export const chipFieldSchema = baseFieldSchema.extend({
  type: z.literal("chip"),
  question: z.string(),
  options: z.array(chipOptionSchema),
  answer_value: chipAnswerSchema,
});

export const traficLightFieldSchema = baseFieldSchema.extend({
  type: z.literal("traffic-light"),
  options: z.tuple([traficLightOptionSchema]),
  answer_value: trafficLightAnswerSchema,
});

export const likertScaleFieldSchema = baseFieldSchema.extend({
  type: z.literal("likert-scale"),
  question: z.string(),
  options: z.array(likertScaleOptionSchema),
  answer_value: likertScaleAnswerSchema,
});

export const textAreaFieldSchema = baseFieldSchema.extend({
  type: z.literal("text-area"),
  question: z.string(),
  options: z.array(textAreaOptionSchema),
  answer_value: textAreaAnswerSchema,
});

export const multiLineTextFieldSchema = baseFieldSchema.extend({
  type: z.literal("multi-line-text"),
  question: z.string(),
  options: z.array(multiLineTextOptionSchema),
  answer_value: multyLineTextAnswerSchema,
  additonal_option_count: z.number(),
  max_length: z.number(),
  placeholder: z.string(),
});

export const fieldSchema = z.discriminatedUnion("type", [
  chipFieldSchema,
  traficLightFieldSchema,
  likertScaleFieldSchema,
  textAreaFieldSchema,
  multiLineTextFieldSchema,
]);

export type FieldInput = z.infer<typeof fieldSchema>;

export const reviewTemplateSchema = z.object({
  id: z.string(),
  metadata: z.object({
    title: z.string(),
    text: z.string(),
    help_url: z.string(),
    indent_level: z.number().optional(),
  }),
  fields: z.array(fieldSchema),
});

export type ReviewTemplateInput = z.infer<typeof reviewTemplateSchema>;
