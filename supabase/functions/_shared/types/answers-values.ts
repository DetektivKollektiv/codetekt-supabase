import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multyLineTextAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "../schemas/answer-schemas.ts";

// Derive types from schemas (single source of truth)
export type MultyLineTextAnswer = z.infer<typeof multyLineTextAnswerSchema>;
export type ChipAnswer = z.infer<typeof chipAnswerSchema>;
export type TrafficLightAnswer = z.infer<typeof trafficLightAnswerSchema>;
export type LikertScaleAnswer = z.infer<typeof likertScaleAnswerSchema>;
export type TextAreaAnswer = z.infer<typeof textAreaAnswerSchema>;
