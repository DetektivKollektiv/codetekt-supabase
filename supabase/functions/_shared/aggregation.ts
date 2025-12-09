import {
    AggregationResult,
    CategoricalAggregation,
    FieldAggregation,
    getFieldType,
    isMetadataField,
    isTrafficLightValue,
    OriginalFieldDefinition,
    OriginalTemplate,
    Review,
    TrafficLightAggregation,
} from "./types.ts";

// ============================================
// MAIN AGGREGATION FUNCTION
// ============================================

export function aggregateReviews(
    reviews: Review[],
    template: OriginalTemplate,
): AggregationResult {
    if (reviews.length < 3) {
        throw new Error(`Need at least 3 reviews, got ${reviews.length}`);
    }

    console.log(`Aggregating ${reviews.length} reviews`);

    // Extract all fields from template
    const allFields = extractAllFields(template);

    // 1. Aggregate metadata
    const metadata = aggregateMetadata(reviews, allFields);

    // 2. Aggregate data fields
    const fields = aggregateFields(reviews, allFields);

    // 3. Calculate overall score
    const result_score = calculateOverallScore(fields);

    // 4. Extract reviewer IDs
    const reviewer_ids = reviews.map((r) => r.reviewed_by);

    return {
        success: true,
        result_score,
        data: {
            metadata,
            fields,
        },
        reviewer_ids,
    };
}

// ============================================
// HELPER: Extract all fields from template
// ============================================

function extractAllFields(
    template: OriginalTemplate,
): OriginalFieldDefinition[] {
    const fields: OriginalFieldDefinition[] = [];

    template.forEach((question) => {
        if (question.fields && Array.isArray(question.fields)) {
            fields.push(...question.fields);
        }
    });

    return fields;
}

// ============================================
// METADATA AGGREGATION
// ============================================

function aggregateMetadata(
    reviews: Review[],
    allFields: OriginalFieldDefinition[],
): { keywords: string[]; content_type: string } {
    const keywordField = allFields.find((f) => f.id === "keyword_type");
    const contentTypeField = allFields.find((f) => f.id === "content_type");

    // Keywords: Union aller Keywords
    const keywordSet = new Set<string>();
    if (keywordField) {
        reviews.forEach((review) => {
            const value = review.data[keywordField.id];
            if (Array.isArray(value)) {
                value.forEach((kw) => {
                    if (typeof kw === "string") {
                        keywordSet.add(kw);
                    }
                });
            }
        });
    }

    // Content Type: First non-null value
    let content_type = "";
    if (contentTypeField) {
        for (const review of reviews) {
            const value = review.data[contentTypeField.id];
            if (typeof value === "string" && value) {
                content_type = value;
                break;
            }
        }
    }

    return {
        keywords: Array.from(keywordSet),
        content_type,
    };
}

// ============================================
// FIELDS AGGREGATION
// ============================================

function aggregateFields(
    reviews: Review[],
    allFields: OriginalFieldDefinition[],
): Record<string, FieldAggregation> {
    const result: Record<string, FieldAggregation> = {};

    // Filter out metadata fields
    const dataFields = allFields.filter((f) => !isMetadataField(f.id));

    for (const field of dataFields) {
        // Collect all values for this field
        const values: unknown[] = reviews
            .map((r) => r.data[field.id])
            .filter((v) => v !== undefined && v !== null);

        if (values.length === 0) continue;

        const fieldType = getFieldType(field);

        // Aggregate based on field type
        if (fieldType === "traffic-light") {
            result[field.id] = aggregateTrafficLight(field.id, values);
        } else if (fieldType === "likert" || fieldType === "chip") {
            result[field.id] = aggregateCategorical(values);
        }
        // text fields werden nicht aggregiert
    }

    return result;
}

// ============================================
// TRAFFIC-LIGHT AGGREGATION
// ============================================

function aggregateTrafficLight(
    fieldId: string,
    values: unknown[],
): TrafficLightAggregation {
    const validValues = values.filter(isTrafficLightValue);

    if (validValues.length === 0) {
        return {
            type: "traffic-light",
            counts: { "1": 0, "2": 0, "3": 0 },
            percentages: { "1": 0, "2": 0, "3": 0 },
            average: 0,
            warnings: [],
        };
    }

    // Calculate counts
    const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
    validValues.forEach((value) => {
        counts[String(value)]++;
    });

    // Calculate percentages
    const total = validValues.length;
    const percentages: Record<string, number> = {};
    Object.keys(counts).forEach((key) => {
        percentages[key] = Math.round((counts[key] / total) * 100);
    });

    // Calculate average
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const average = Number((sum / total).toFixed(2));

    // Generate warnings
    const warnings: string[] = [];
    if (percentages["1"] >= 60) {
        warnings.push(getWarningForField(fieldId));
    }

    return {
        type: "traffic-light",
        counts,
        percentages,
        average,
        warnings,
    };
}

// ============================================
// CATEGORICAL AGGREGATION
// ============================================

function aggregateCategorical(values: unknown[]): CategoricalAggregation {
    const stringValues = values.filter((v) =>
        typeof v === "string"
    ) as string[];

    if (stringValues.length === 0) {
        return {
            type: "categorical",
            counts: {},
            percentages: {},
        };
    }

    // Calculate counts
    const counts: Record<string, number> = {};
    stringValues.forEach((value) => {
        counts[value] = (counts[value] || 0) + 1;
    });

    // Calculate percentages
    const total = stringValues.length;
    const percentages: Record<string, number> = {};
    Object.keys(counts).forEach((key) => {
        percentages[key] = Math.round((counts[key] / total) * 100);
    });

    return {
        type: "categorical",
        counts,
        percentages,
    };
}

// ============================================
// OVERALL SCORE CALCULATION
// ============================================

function calculateOverallScore(
    fields: Record<string, FieldAggregation>,
): number {
    const trafficLightFields = Object.values(fields).filter(
        (f): f is TrafficLightAggregation => f.type === "traffic-light",
    );

    if (trafficLightFields.length === 0) return 0;

    const sum = trafficLightFields.reduce(
        (acc, field) => acc + field.average,
        0,
    );
    const average = sum / trafficLightFields.length;

    // Convert 1-3 scale to 0-4 scale
    // 1 (rot) → 0, 2 (gelb) → 2, 3 (grün) → 4
    const scaled = ((average - 1) / 2) * 4;

    return Number(scaled.toFixed(2));
}

// ============================================
// WARNING GENERATION
// ============================================

function getWarningForField(fieldId: string): string {
    const warningMap: Record<string, string> = {
        external_sources: "Keine oder unzureichende Quellen",
        grammar: "Grammatik- und Rechtschreibfehler",
        objectivity: "Subjektiv oder Hetze",
        perspectives: "Einseitige Berichterstattung",
        author_credentials: "Autor nicht fachkundig",
        claims_match_sources: "Behauptungen widersprechen Quellen",
        public_media_match: "Keine vergleichbare Berichterstattung",
        structure: "Unklare Struktur",
        headline: "Reißerische Überschrift",
        images_quality: "Irrelevante oder schlechte Bilder",
    };

    return warningMap[fieldId] || "Mehrheitlich negativ bewertet";
}
