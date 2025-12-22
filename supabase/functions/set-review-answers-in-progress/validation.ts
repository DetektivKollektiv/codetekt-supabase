import { z } from "npm:zod@4.1.13";
import { inProgressReviewAnswerSchema } from "../_shared/schemas/index.ts";

export const payloadSchema = z.object({
  case_id: z.uuid(),
  data: z.record(z.string(), z.unknown()),
});

// Simple validation result - no dual schema needed
export type ValidationResult =
  | { success: true; validatedData: Record<string, unknown> }
  | { success: false; error: { error: string; details: z.ZodIssue[] } };

/**
 * Validates review answer data for in-progress saving.
 * All fields are optional - user can save partial data.
 *
 * @param data - Review answer data to validate
 * @returns ValidationResult with validated data or error details
 */
export function validateInProgressData(
  data: Record<string, unknown>,
): ValidationResult {
  const validation = inProgressReviewAnswerSchema.safeParse(data);

  if (validation.success) {
    return {
      success: true,
      validatedData: validation.data as Record<string, unknown>,
    };
  }

  return {
    success: false,
    error: {
      error: "Invalid review answer data",
      details: validation.error.issues,
    },
  };
}
