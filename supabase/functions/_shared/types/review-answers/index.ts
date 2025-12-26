import { z } from "npm:zod@4.1.13";
import { reviewAnswerSchema } from "../../schemas/answer-schemas.ts";

// Derive type from schema (single source of truth)
export type ReviewAnswer = z.infer<typeof reviewAnswerSchema>;
