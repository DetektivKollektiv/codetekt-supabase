import { z } from "npm:zod@4.1.13";
import {
  inProgressReviewAnswerSchema,
  submittedReviewAnswerSchema,
} from "../_shared/schemas/index.ts";

export const payloadSchema = z.object({
  case_id: z.uuid(),
  data: z.record(z.string(), z.unknown()),
});

export type ValidationSuccess = {
  success: true;
  status: "submitted" | "in_progress";
  validatedData: Record<string, unknown>;
  submitted_at: string | null;
};

export type ValidationError = {
  success: false;
  error: {
    error: string;
    details: {
      submitted_validation_errors: z.ZodIssue[];
      in_progress_validation_errors: z.ZodIssue[];
    };
  };
};

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Validates review answer data against two schemas to determine if it's
 * complete (submitted) or partial (in-progress).
 *
 * Validation logic:
 * 1. First tries to validate against submittedReviewAnswerSchema (all required fields)
 *    - Success → status: "submitted", submitted_at: current timestamp
 * 2. If fails, tries inProgressReviewAnswerSchema (all fields optional)
 *    - Success → status: "in_progress", submitted_at: null
 * 3. If both fail → returns detailed validation errors
 *
 * @param data - Review answer data to validate
 * @returns ValidationResult with status and validated data, or error details
 */
export function validateReviewAnswer(
  data: Record<string, unknown>,
): ValidationResult {
  // Try to validate as submitted (complete) review first
  const submittedValidation = submittedReviewAnswerSchema.safeParse(data);

  if (submittedValidation.success) {
    // Data is complete and valid for submission
    return {
      success: true,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      validatedData: submittedValidation.data as Record<string, unknown>,
    };
  }

  // Try to validate as in-progress (partial) review
  const inProgressValidation = inProgressReviewAnswerSchema.safeParse(data);

  if (inProgressValidation.success) {
    // Data is valid but incomplete
    return {
      success: true,
      status: "in_progress",
      submitted_at: null,
      validatedData: inProgressValidation.data as Record<string, unknown>,
    };
  }

  // Data is invalid - return detailed errors from both validations
  return {
    success: false,
    error: {
      error: "Invalid review answer data",
      details: {
        submitted_validation_errors: submittedValidation.error.issues,
        in_progress_validation_errors: inProgressValidation.error.issues,
      },
    },
  };
}
