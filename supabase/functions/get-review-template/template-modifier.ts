import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  multiLineTextAnswerSchema,
  textAnswerSchema,
} from "../_shared/schemas/answer-schemas.ts";
import {
  chipFieldSchema,
  multiLineTextFieldSchema,
  textFieldSchema,
} from "../_shared/schemas/field-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";

type ChipField = z.infer<typeof chipFieldSchema>;
type MultiLineTextField = z.infer<typeof multiLineTextFieldSchema>;
type TextField = z.infer<typeof textFieldSchema>;

/**
 * Deep clone template to avoid reference issues
 */
export function deepCloneTemplate(template: unknown): ReviewTemplateInput[] {
  return JSON.parse(JSON.stringify(template)) as ReviewTemplateInput[];
}

/**
 * Aggregate keywords from all submitted reviews
 * Returns deduplicated array of keywords
 */
export function aggregateKeywords(
  submittedReviews: Array<{ data: unknown }>,
): string[] {
  const keywordSet = new Set<string>();

  for (const review of submittedReviews) {
    const data = review.data as Record<string, unknown>;
    const keywords = data.keyword_type;

    // Validate with schema
    const parsed = multiLineTextAnswerSchema.safeParse(keywords);
    if (parsed.success && parsed.data) {
      parsed.data.forEach((kw) => keywordSet.add(kw));
    }
  }

  return Array.from(keywordSet);
}

/**
 * Get content types from the first submitted review
 * Returns content types array from the first review, or null if not found
 */
export function aggregateContentTypes(
  submittedReviews: Array<{ data: unknown }>,
): string[] | null {
  if (submittedReviews.length === 0) return null;

  const firstReview = submittedReviews[0];
  const data = firstReview.data as Record<string, unknown>;
  const contentTypes = data.content_type;

  // Validate with schema
  const parsed = chipAnswerSchema.safeParse(contentTypes);
  if (parsed.success && parsed.data) {
    return parsed.data;
  }

  return null;
}

/**
 * Aggregate title from the first submitted review
 * Returns the title from the first review, or null if not found
 */
export function aggregateTitle(
  submittedReviews: Array<{ data: unknown }>,
): string | null {
  if (submittedReviews.length === 0) return null;

  const firstReview = submittedReviews[0];
  const data = firstReview.data as Record<string, unknown>;
  const title = data.title;

  // Validate with schema
  const parsed = textAnswerSchema.safeParse(title);
  if (parsed.success && parsed.data) {
    return parsed.data;
  }

  return null;
}

/**
 * Modify keywords field based on reviewer status
 */
export function modifyKeywordsField(
  field: MultiLineTextField,
  submittedReviewCount: number,
  aggregatedKeywords: string[],
): MultiLineTextField {
  if (submittedReviewCount === 0) {
    // First reviewer - field is required
    return {
      ...field,
      is_required: true,
    };
  }

  // Subsequent reviewer - set initial_answer_value with aggregated keywords
  // Field is locked and only disputable after initial review
  return {
    ...field,
    is_required: false,
    is_disabled: true,
    is_disputable: true,
    initial_answer_value: aggregatedKeywords,
  } as MultiLineTextField;
}

/**
 * Modify content type field based on reviewer status
 */
export function modifyContentTypeField(
  field: ChipField,
  submittedReviewCount: number,
  aggregatedContentTypes: string[] | null,
): ChipField {
  if (submittedReviewCount === 0) {
    // First reviewer - field is required
    return {
      ...field,
      is_required: true,
    };
  }

  // Subsequent reviewer - set initial_answer_value with content types from first reviewer
  // Field remains disabled but shows initial values from first reviewer
  return {
    ...field,
    is_required: false,
    is_disabled: true,
    is_disputable: true,
    initial_answer_value: aggregatedContentTypes,
  } as ChipField;
}

/**
 * Modify title field based on reviewer status
 */
export function modifyTitleField(
  field: TextField,
  submittedReviewCount: number,
  aggregatedTitle: string | null,
): TextField {
  if (submittedReviewCount === 0) {
    // First reviewer - field is required
    return {
      ...field,
      is_required: true,
    };
  }

  // Subsequent reviewer - set initial_answer_value with title from first reviewer
  // Field remains disabled but shows initial value from first reviewer
  return {
    ...field,
    is_required: false,
    is_disabled: true,
    is_disputable: true,
    initial_answer_value: aggregatedTitle,
  } as TextField;
}

/**
 * Modify any field with admin-resolved dispute value
 * The final_value is stored as JSON string in database and needs parsing
 */
export function modifyFieldWithResolvedDispute<T extends { id: string }>(
  field: T,
  finalValue: string,
): T {
  // Parse final_value from JSON string
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(finalValue);
  } catch (err) {
    console.error(`Failed to parse final_value for ${field.id}:`, err);
    parsedValue = null;
  }

  return {
    ...field,
    is_required: false,
    is_disputable: false,
    is_disabled: true,
    initial_answer_value: parsedValue,
  } as T;
}

/**
 * Apply field modification by replacing a specific field in the template
 */
export function replaceField(
  sections: ReviewTemplateInput[],
  fieldId: string,
  modifiedField: ChipField | MultiLineTextField | TextField,
): ReviewTemplateInput[] {
  return sections.map((section) => ({
    ...section,
    fields: section.fields.map((field) =>
      field.id === fieldId ? modifiedField : field
    ),
  }));
}

/**
 * Populate answer_value fields with user's in-progress review data
 * Note: TypeScript cannot properly narrow discriminated union types when dynamically
 * assigning values. We use @ts-expect-error to suppress the type error since we
 * validate the data at runtime and all tests confirm correct behavior.
 */
export function populateAnswerValues(
  sections: ReviewTemplateInput[],
  inProgressData: Record<string, unknown>,
): ReviewTemplateInput[] {
  const sectionsWithValues = sections.map((section) => {
    const newSection = { ...section };
    // @ts-expect-error - TypeScript cannot narrow discriminated union types here
    newSection.fields = section.fields.map((field) => {
      const value = inProgressData[field.id];
      if (value === undefined) return field;
      return { ...field, answer_value: value };
    });
    return newSection;
  });

  return JSON.parse(
    JSON.stringify(sectionsWithValues),
  ) as ReviewTemplateInput[];
}
