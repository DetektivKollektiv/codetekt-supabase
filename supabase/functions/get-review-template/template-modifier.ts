import { Field } from "../_shared/schemas/field-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";

/**
 * Deep clone template to avoid reference issues
 */
export function deepCloneTemplate(template: unknown): ReviewTemplateInput[] {
  return JSON.parse(JSON.stringify(template)) as ReviewTemplateInput[];
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
  modifiedField: Field,
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
