import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multiLineTextAnswerSchema,
  textAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";
import { conditionSchema } from "./condition-schemas.ts";
import {
  chipOptionSchema,
  likertScaleOptionSchema,
  multiLineTextOptionSchema,
  textAreaOptionSchema,
  textOptionSchema,
  trafficLightOptionSchema,
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
  answer_value: chipAnswerSchema.optional(),
});

export const trafficLightFieldSchema = baseFieldSchema.extend({
  type: z.literal("traffic-light"),
  question: z.string(),
  options: z.array(trafficLightOptionSchema),
  answer_value: trafficLightAnswerSchema.optional(),
});

export const likertScaleFieldSchema = baseFieldSchema.extend({
  type: z.literal("likert-scale"),
  question: z.string(),
  options: z.array(likertScaleOptionSchema),
  answer_value: likertScaleAnswerSchema.optional(),
});

export const textAreaFieldSchema = baseFieldSchema.extend({
  type: z.literal("text-area"),
  question: z.string(),
  options: z.array(textAreaOptionSchema),
  answer_value: textAreaAnswerSchema.optional(),
});

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal("text"),
  question: z.string(),
  options: z.array(textOptionSchema),
  answer_value: textAnswerSchema.optional(),
});

export const multiLineTextFieldSchema = baseFieldSchema.extend({
  type: z.literal("multi-line-text"),
  question: z.string(),
  options: z.array(multiLineTextOptionSchema),
  answer_value: multiLineTextAnswerSchema.optional(),
  additonal_option_count: z.number(),
  max_length: z.number(),
  placeholder: z.string(),
});

// Base metadata field schema with initial_answer_value
export const baseMetadataFieldSchema = z.object({
  initial_answer_value: z.unknown().optional(),
});

// Metadata field schemas - merge base metadata with specific field types
export const titleMetadataFieldSchema = textFieldSchema.merge(
  baseMetadataFieldSchema.extend({
    initial_answer_value: textAnswerSchema.optional(),
  }),
);

export const keywordTypeMetadataFieldSchema = multiLineTextFieldSchema.merge(
  baseMetadataFieldSchema.extend({
    initial_answer_value: multiLineTextAnswerSchema.optional(),
  }),
);

export const contentTypeMetadataFieldSchema = chipFieldSchema.merge(
  baseMetadataFieldSchema.extend({
    initial_answer_value: chipAnswerSchema.optional(),
  }),
);

// Discriminated union of all field types
export const fieldSchema = z.discriminatedUnion("type", [
  chipFieldSchema,
  trafficLightFieldSchema,
  likertScaleFieldSchema,
  textAreaFieldSchema,
  multiLineTextFieldSchema,
  textFieldSchema,
]);

export type Field = z.infer<typeof fieldSchema>;
export type TitleMetadataField = z.infer<typeof titleMetadataFieldSchema>;
export type KeywordTypeMetadataField = z.infer<
  typeof keywordTypeMetadataFieldSchema
>;
export type ContentTypeMetadataField = z.infer<
  typeof contentTypeMetadataFieldSchema
>;
