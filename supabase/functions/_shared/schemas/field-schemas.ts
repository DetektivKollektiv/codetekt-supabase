import { z } from "npm:zod@4.1.13";
import { conditionSchema } from "./condition-schemas.ts";
import {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multyLineTextAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";
import {
  chipOptionSchema,
  likertScaleOptionSchema,
  multiLineTextOptionSchema,
  textAreaOptionSchema,
  traficLightOptionSchema,
} from "./option-schemas.ts";

// Base field schema with conditional properties
export const baseFieldSchema = z.object({
  id: z.string(),
  is_disabled: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_required: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_shown: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
  is_disputable: z.union([z.boolean(), z.array(conditionSchema)]).optional(),
});

// Specific field type schemas
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

// Discriminated union of all field types
export const fieldSchema = z.discriminatedUnion("type", [
  chipFieldSchema,
  traficLightFieldSchema,
  likertScaleFieldSchema,
  textAreaFieldSchema,
  multiLineTextFieldSchema,
]);

export type FieldInput = z.infer<typeof fieldSchema>;
