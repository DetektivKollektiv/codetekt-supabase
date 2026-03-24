export type FieldTagByBucket = {
  value0: string;
  value1_2_3: string;
};

export const DEFAULT_FIELD_TAG: FieldTagByBucket = {
  value0: "Value 0: Fall",
  value1_2_3: "Value 1,2,3: Fall",
};

export const FIELD_TAGS: Record<string, FieldTagByBucket> = {
  "content_claims_not_debunked": {
    value0: "≈",
    value1_2_3: "",
  },
  "content_headline_matches_article": {
    value0: "Passende Überschrift",
    value1_2_3: "Clickbait",
  },
  "content_language": {
    value0: "Grammatik und Rechtschreibung",
    value1_2_3: "Fehlerhafte Grammatik und Rechtschreibung",
  },
  "content_objective_no_hate_no_panic": {
    value0: "Objektivität des Beitrags",
    value1_2_3: "Mangelnde Objekivität",
  },
  "content_addtional_points": {
    value0: "",
    value1_2_3: "",
  },
  "content_additional_points_details": {
    value0: "",
    value1_2_3: "",
  },

  "media_no_ai_or_staging_doubts": {
    value0: "",
    value1_2_3: "",
  },
  "media_objectivity": {
    value0: "Objektivität der Bilder und Videos",
    value1_2_3: "Mangelnde Objektivität der Bilder und Videos",
  },
  "media_visualizations_not_distorted": {
    value0: "Einsatz von Visualisierungen",
    value1_2_3: "Mangelhafte Visualisierungen",
  },
  "media_addtional_points": {
    value0: "",
    value1_2_3: "",
  },
  "media_additional_points_details": {
    value0: "",
    value1_2_3: "",
  },

  "medium_independent_no_conflicts": {
    value0: "Finanzielle und politische Unabhängigkeit",
    value1_2_3: "Finanzielle oder politische Färbung",
  },
  "medium_authenticity": {
    value0: "Authentischer Internetauftritt",
    value1_2_3: "Unauthentischer Internetauftritt",
  },
  "medium_additional_points": {
    value0: "",
    value1_2_3: "",
  },
  "medium_additional_points_details": {
    value0: "",
    value1_2_3: "",
  },

  "quotes_identifiable_people": {
    value0: "Identifizierbare Personen",
    value1_2_3: "Personen erschwert identifizierbar",
  },
  "quotes_experts_reputation": {
    value0: "Expert*innen besitzen Expertise im Themengebiet",
    value1_2_3: "Mangelnde Expertise der zitierten Expert*innen",
  },
  "quotes_match_originals": {
    value0: "Übereinstimmung der Zitate im Kontext",
    value1_2_3: "Mangelnde Übereinstimmung der Zitate im Kontext",
  },
  "quotes_additional_points": {
    value0: "",
    value1_2_3: "",
  },
  "quotes_additional_points_details": {
    value0: "",
    value1_2_3: "",
  },
  "source_text_message_author_expertise": {
    value0: "",
    value1_2_3: "Verfasser*in fragwüdig",
  },
  "source_claims_supported": {
    value0: "Vorhandene Quellenbelege",
    value1_2_3: "Mangelnde Quellenbelege",
  },
  "source_listed_and_verifiable": {
    value0: "Nachprüfbare Quellenangaben",
    value1_2_3: "Quellenangaben mangelhaft nachprüfbar",
  },
  "source_additional_points": {
    value0: "",
    value1_2_3: "",
  },
  "source_additional_points_details": {
    value0: "",
    value1_2_3: "",
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
