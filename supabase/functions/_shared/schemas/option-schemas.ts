import { z } from "npm:zod@4.1.13";

// Option schemas for different field types

export const chipOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const trafficLightOptionSchema = z.object({
  id: z.string(),
  color: z.string(),
  value: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});

export const likertScaleOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
  color: z.string(),
  value: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export const textAreaOptionSchema = z.object({
  id: z.string(),
  placeholder: z.string(),
  max_length: z.number(),
});

export const textOptionSchema = z.object({
  id: z.string(),
  placeholder: z.string(),
  max_length: z.number(),
  min_length: z.number().optional(),
});

export const multiLineTextOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_disabled: z.boolean(),
});
