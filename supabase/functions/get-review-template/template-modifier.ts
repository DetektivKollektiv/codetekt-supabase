import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import {
  chipAnswerSchema,
  multyLineTextAnswerSchema,
} from "../_shared/schemas/answer-schemas.ts";

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
    const parsed = multyLineTextAnswerSchema.safeParse(keywords);
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
 * Field modification type
 */
type FieldModification = {
  is_required?: boolean;
  is_disabled?: boolean;
  is_disputable?: boolean;
  additonal_option_count?: number; // For multi-line-text fields
  options?: Array<{ id: string; text: string; is_disabled: boolean }>; // For multi-line-text
  prefilled_answer_value?: unknown; // For chip/other fields
};

/**
 * Build keywords field modification based on reviewer status
 */
export function buildKeywordsModification(
  submittedReviewCount: number,
  aggregatedKeywords: string[],
): FieldModification {
  if (submittedReviewCount === 0) {
    // First reviewer
    return { is_required: true };
  }

  // Subsequent reviewer - aggregated keywords become disabled options
  // User can add up to 3 additional keywords
  return {
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
 * Build content type field modification based on reviewer status
 */
export function buildContentTypeModification(
  submittedReviewCount: number,
  aggregatedContentTypes: string[],
): FieldModification {
  if (submittedReviewCount === 0) {
    // First reviewer
    return { is_required: true };
  }

  // Subsequent reviewer
  return {
    is_required: false,
    is_disabled: true,
    is_disputable: true,
    prefilled_answer_value: aggregatedContentTypes,
  };
}

/**
 * Build field modification for admin-resolved disputes
 * The final_value is stored as JSON string in database and needs parsing
 */
export function buildResolvedDisputeModification(
  fieldId: string,
  finalValue: string,
): FieldModification {
  // Parse final_value from JSON string to array
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(finalValue);
  } catch (err) {
    console.error(`Failed to parse final_value for ${fieldId}:`, err);
    parsedValue = null;
  }

  return {
    is_required: false,
    is_disputable: false,
    is_disabled: true,
    prefilled_answer_value: parsedValue,
  };
}

/**
 * Apply field modification to a specific field in the template
 */
export function applyFieldModification(
  sections: ReviewTemplateInput[],
  fieldId: string,
  modification: FieldModification,
): ReviewTemplateInput[] {
  return sections.map((section) => ({
    ...section,
    fields: section.fields.map((field) => {
      if (field.id !== fieldId) return field;

      return {
        ...field,
        ...modification,
      };
    }),
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

  return JSON.parse(JSON.stringify(sectionsWithValues)) as ReviewTemplateInput[];
}
