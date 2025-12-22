import { submittedReviewAnswerSchema } from "../_shared/schemas/review-schemas.ts";
import { ZodIssue } from "npm:zod@4.1.13";

export type ValidationResult =
  | {
    success: true;
    validatedData: Record<string, unknown>;
  }
  | {
    success: false;
    error: {
      error: string;
      details: ZodIssue[];
    };
  };

/**
 * Validates review answer data using strict schema (all fields required).
 *
 * This validation is used for publishing reviews to the submitted table.
 * All required fields must be present and valid.
 *
 * @param data - The review answer data to validate
 * @returns ValidationResult with validated data or error details
 */
export function validateSubmittedData(
  data: Record<string, unknown>,
): ValidationResult {
  const validation = submittedReviewAnswerSchema.safeParse(data);

  if (validation.success) {
    return {
      success: true,
      validatedData: validation.data as Record<string, unknown>,
    };
  }

  return {
    success: false,
    error: {
      error: "Invalid review answer data - all required fields must be present",
      details: validation.error.issues,
    },
  };
}
