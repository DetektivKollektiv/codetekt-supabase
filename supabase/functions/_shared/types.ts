// Types
export interface Review {
    id: string;
    case_id: string;
    reviewed_by: string;
    status: string;
    data: Record<string, any>;
    submitted_at: string;
}

export interface FieldAggregation {
    counts: Record<string, number>;
    percentages: Record<string, number>;
    average?: number;
    warnings?: string[];
}

export interface AggregatedData {
    metadata: {
        keywords: string[];
        content_type: string;
    };
    fields: Record<string, FieldAggregation>;
}
