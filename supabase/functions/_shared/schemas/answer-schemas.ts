import { z } from "npm:zod@4.1.13";

// Base answer value schemas for different field types
export const multyLineTextAnswerSchema = z.array(z.string()).nullable();
export const chipAnswerSchema = z.array(z.string()).nullable();
export const trafficLightAnswerSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
  .nullable();
export const likertScaleAnswerSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
  .nullable();
export const textAreaAnswerSchema = z.string().nullable();

// Generic review answer schema (record of field_id -> answer value)
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
