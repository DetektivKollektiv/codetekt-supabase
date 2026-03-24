export type FieldTagByBucket = {
  value0: string;
  value1_2_3: string;
};

export const DEFAULT_FIELD_TAG: FieldTagByBucket = {
  value0: "Value 0: Fall",
  value1_2_3: "Value 1,2,3: Fall",
};

export const FIELD_TAGS: Record<string, FieldTagByBucket> = {
  "content_accuracy": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_claims_not_debunked": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_headline_matches_article": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_language": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_objective_no_hate_no_panic": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_addtional_points": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "content_additional_points_details": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },

  "media_no_ai_or_staging_doubts": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "media_objectivity": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "media_visualizations_not_distorted": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "media_addtional_points": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "media_additional_points_details": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },

  "medium_independent_no_conflicts": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "medium_authenticity": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "medium_additional_points": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "medium_additional_points_details": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },

  "quotes_identifiable_people": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "quotes_experts_reputation": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "quotes_match_originals": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "quotes_additional_points": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "quotes_additional_points_details": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },

  "source_author_expertise": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "source_text_message_author_expertise": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "source_claims_supported": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "source_listed_and_verifiable": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "source_additional_points": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
  "source_additional_points_details": {
    value0: "Value 0: Fall",
    value1_2_3: "Value 1,2,3: Fall",
  },
};

export const QUESTION_ICONS: Record<
  string,
  string
> = {
  content_question: "notebook-text",
  media_question: "image",
  medium_question: "newspaper",
  source_question: "link-2",
  quotes_question: "quote",
};

export const SKIPPED_QUESTION_IDS = [
  "submit_question",
];
