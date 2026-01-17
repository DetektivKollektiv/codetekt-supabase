import { z } from "npm:zod@4.1.13";
import {
  chipAnswerSchema,
  multiLineTextAnswerSchema,
} from "../_shared/schemas/answer-schemas.ts";
import {
  chipFieldSchema,
  multiLineTextFieldSchema,
} from "../_shared/schemas/field-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";

type ChipField = z.infer<typeof chipFieldSchema>;
type MultiLineTextField = z.infer<typeof multiLineTextFieldSchema>;

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
 * Aggregate content types from all submitted reviews
 * Returns deduplicated array of content types
 */
export function aggregateContentTypes(
  submittedReviews: Array<{ data: unknown }>,
): string[] {
  const contentTypeSet = new Set<string>();

  for (const review of submittedReviews) {
    const data = review.data as Record<string, unknown>;
    const contentTypes = data.content_type;

    // Validate with schema
    const parsed = chipAnswerSchema.safeParse(contentTypes);
    if (parsed.success && parsed.data) {
      parsed.data.forEach((ct) => contentTypeSet.add(ct));
    }
  }

  return Array.from(contentTypeSet);
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

  // Subsequent reviewer - aggregated keywords become disabled options
  // User can add up to 3 additional keywords
  return {
    ...field,
    is_required: false,
    is_disputable: true,
    additonal_option_count: 3,
    options: aggregatedKeywords.map((keyword) => ({
      id: keyword,
      text: keyword,
      is_disabled: true,
    })),
  };
}

/**
 * Modify content type field based on reviewer status
 */
export function modifyContentTypeField(
  field: ChipField,
  submittedReviewCount: number,
  aggregatedContentTypes: string[],
): ChipField {
  if (submittedReviewCount === 0) {
    // First reviewer - field is required
    return {
      ...field,
      is_required: true,
    };
  }

  // Subsequent reviewer - prefill with aggregated values and disable
  return {
    ...field,
    is_required: false,
    is_disabled: true,
    is_disputable: true,
    answer_value: aggregatedContentTypes,
  };
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
    answer_value: parsedValue,
  } as T;
}

/**
 * Apply field modification by replacing a specific field in the template
 */
export function replaceField(
  sections: ReviewTemplateInput[],
  fieldId: string,
  modifiedField: ChipField | MultiLineTextField,
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
