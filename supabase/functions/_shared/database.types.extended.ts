import { Database } from "./database.types.ts";
import { AggregatedData, OriginalTemplate, ReviewData } from "./types.ts";

// Erweitere die generierten Types
export type Tables = Database["public"]["Tables"];
export type Functions = Database["public"]["Functions"];

// Typisierte Versionen der Tabellen
export type Review = Tables["reviews"]["Row"] & {
    data: ReviewData;
};

export type ReviewInsert = Tables["reviews"]["Insert"] & {
    data: ReviewData;
};

export type ReviewUpdate = Tables["reviews"]["Update"] & {
    data?: ReviewData;
};

export type AggregatedReview = Tables["aggregated_reviews"]["Row"] & {
    data: AggregatedData;
};

export type AggregatedReviewInsert = Tables["aggregated_reviews"]["Insert"] & {
    data: AggregatedData;
};

export type ReviewTemplateRow = Tables["review_templates"]["Row"] & {
    template: ReviewTemplate;
};

export type Case = Tables["cases"]["Row"];
export type CaseDispute = Tables["case_disputes"]["Row"];

// Re-export für convenience
export type { AggregatedData, Database, ReviewData, ReviewTemplate };
