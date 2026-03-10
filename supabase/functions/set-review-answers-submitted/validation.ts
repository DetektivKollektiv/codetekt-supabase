import { ZodIssue } from "npm:zod@4.1.13";
import {
  submittedReviewAnswerOpinionSchema,
  submittedReviewAnswerReportSchema,
  submittedReviewAnswerSatireSchema,
  submittedReviewAnswerTextMessageSchema,
} from "../_shared/schemas/review-schemas.ts";

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

const schemaMap = {
  report: submittedReviewAnswerReportSchema,
  opinion: submittedReviewAnswerOpinionSchema,
  satire: submittedReviewAnswerSatireSchema,
  text_message: submittedReviewAnswerTextMessageSchema,
} as const;

type Category = keyof typeof schemaMap;

/**
 * Validates review answer data using the category-specific strict schema.
 *
 * This validation is used for publishing reviews to the submitted table.
 * All required fields for the given category must be present and valid.
 *
 * @param data - The review answer data to validate
 * @param category - The case category (report, opinion, satire, text_message)
 * @returns ValidationResult with validated data or error details
 */
export function validateSubmittedData(
  data: Record<string, unknown>,
  category: string,
): ValidationResult {
  const schema = schemaMap[category as Category];

  if (!schema) {
    return {
      success: false,
      error: {
        error: `Unknown category: ${category}`,
        details: [],
      },
    };
  }

  const validation = schema.safeParse(data);

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
