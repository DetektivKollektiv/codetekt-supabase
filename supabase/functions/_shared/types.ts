// ============================================
// ORIGINAL TEMPLATE TYPES (dein Format)
// ============================================

export interface OriginalTemplateQuestion {
    id: string;
    metadata: {
        title: string;
        text: string;
        help_url: string;
        indent_level: number;
    };
    fields: OriginalFieldDefinition[];
}

export interface OriginalFieldDefinition {
    id: string;
    type:
        | "traffic-light"
        | "likert-scale"
        | "chip"
        | "text-area"
        | "multi-line-text";
    question?: string;
    options?: FieldOption[];
    is_required: boolean;
    is_disabled?: boolean;
    is_disputable?: boolean;
    max_length?: number;
    placeholder?: string;
    additonal_option_count?: number;
    is_shown?: any[];
}

export interface FieldOption {
    id: string;
    text?: string;
    description?: string;
    color?: string;
    value?: number;
    question?: string;
    placeholder?: string;
    max_length?: number;
}

export type OriginalTemplate = OriginalTemplateQuestion[];

// ============================================
// REVIEW DATA TYPES
// ============================================

export type TrafficLightValue = 1 | 2 | 3;
export type LikertValue = string;
export type ChipValue = string;
export type TextValue = string;
export type KeywordValue = string[];

export type FieldValue =
    | TrafficLightValue
    | LikertValue
    | ChipValue
    | TextValue
    | KeywordValue;

export type ReviewData = Record<string, FieldValue | undefined>;

// ============================================
// AGGREGATION TYPES
// ============================================

export interface TrafficLightAggregation {
    type: "traffic-light";
    counts: Record<string, number>;
    percentages: Record<string, number>;
    average: number;
    warnings: string[];
}

export interface CategoricalAggregation {
    type: "categorical";
    counts: Record<string, number>;
    percentages: Record<string, number>;
}

export interface KeywordAggregation {
    type: "keyword";
    keywords: string[];
    frequency: Record<string, number>;
}

export interface ContentTypeAggregation {
    type: "content-type";
    value: string;
    distribution: Record<string, number>;
}

export type FieldAggregation =
    | TrafficLightAggregation
    | CategoricalAggregation
    | KeywordAggregation
    | ContentTypeAggregation;

export interface AggregatedMetadata {
    keywords: string[];
    content_type: string;
}

export interface AggregatedData {
    metadata: AggregatedMetadata;
    fields: Record<string, FieldAggregation>;
}

// ============================================
// HELPER INTERFACES
// ============================================

export interface Review {
    id: string;
    reviewed_by: string;
    data: ReviewData;
}

export interface AggregationResult {
    success: boolean;
    result_score: number;
    data: AggregatedData;
    reviewer_ids: string[];
}

// ============================================
// TYPE GUARDS
// ============================================

export function isTrafficLightValue(
    value: unknown,
): value is TrafficLightValue {
    return typeof value === "number" && value >= 1 && value <= 3;
}

export function isKeywordValue(value: unknown): value is KeywordValue {
    return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export function isTextValue(value: unknown): value is TextValue {
    return typeof value === "string";
}

// ============================================
// FIELD TYPE HELPERS
// ============================================

export function getFieldType(field: OriginalFieldDefinition): string {
    // Spezielle Field-IDs
    if (field.id === "keyword_type") return "keyword";
    if (field.id === "content_type") return "content-type";

    // Nach Original-Type
    switch (field.type) {
        case "traffic-light":
            return "traffic-light";
        case "likert-scale":
            return "likert";
        case "chip":
            return "chip";
        case "text-area":
        case "multi-line-text":
            return "text";
        default:
            return "unknown";
    }
}

export function isMetadataField(fieldId: string): boolean {
    return fieldId === "keyword_type" || fieldId === "content_type";
}

// ============================================
// VALIDATION
// ============================================

export function validateFieldValue(
    field: OriginalFieldDefinition,
    value: unknown,
): { valid: boolean; error?: string } {
    const fieldType = getFieldType(field);

    switch (fieldType) {
        case "traffic-light":
            if (!isTrafficLightValue(value)) {
                return { valid: false, error: "Value must be 1, 2, or 3" };
            }
            return { valid: true };

        case "likert":
        case "chip":
            if (typeof value !== "string") {
                return { valid: false, error: "Value must be a string" };
            }
            const optionIds = field.options?.map((opt) => opt.id) || [];
            if (!optionIds.includes(value)) {
                return {
                    valid: false,
                    error: `Value must be one of: ${optionIds.join(", ")}`,
                };
            }
            return { valid: true };

        case "text":
            if (!isTextValue(value)) {
                return { valid: false, error: "Value must be a string" };
            }
            if (field.max_length && value.length > field.max_length) {
                return {
                    valid: false,
                    error: `Text exceeds max length of ${field.max_length}`,
                };
            }
            return { valid: true };

        case "keyword":
            if (!isKeywordValue(value)) {
                return {
                    valid: false,
                    error: "Value must be an array of strings",
                };
            }
            return { valid: true };

        case "content-type":
            if (typeof value !== "string") {
                return { valid: false, error: "Value must be a string" };
            }
            return { valid: true };

        default:
            return { valid: false, error: "Unknown field type" };
    }
}
