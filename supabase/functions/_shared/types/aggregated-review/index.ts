import { ChipAnswer, MultyLineTextAnswer } from "../answers-values.ts";

export interface AggregatedFieldValue {
    counts: { 0: number; 1: number; 2: number; 3: number };
    percentages: { 0: number; 1: number; 2: number; 3: number };
    average: number;
    warnings: string[];
}

export interface AggregatedReview {
    metadata: {
        keywords: MultyLineTextAnswer;
        content_type: ChipAnswer;
    };
    fields: Record<string, AggregatedFieldValue>;
}
