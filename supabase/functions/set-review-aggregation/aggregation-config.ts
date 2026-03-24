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
    value0: "Value 0: Darstellung unterschiedlicher Positionen",
    value1_2_3: "Value 1,2,3: Darstellung unterschiedlicher Positionen",
  },
  "content_advertising": {
    value0: "Value 0: Werbefreier Beitrag",
    value1_2_3: "Value 1,2,3: Werbefreier Beitrag",
  },
  "content_claims_not_debunked": {
    value0: "Value 0: Factchecking des Beitrags",
    value1_2_3: "Value 1,2,3: Factchecking des Beitrags",
  },
  "content_clarity": {
    value0: "Value 0: Aussagekraft der Informationen",
    value1_2_3: "Value 1,2,3: Aussagekraft der Informationen",
  },
  "content_headline_matches_article": {
    value0: "Value 0: Passende Überschrift",
    value1_2_3: "Value 1,2,3: Passende Überschrift",
  },
  "content_language": {
    value0: "Value 0: Grammatik und Rechtschreibung",
    value1_2_3: "Value 1,2,3: Grammatik und Rechtschreibung",
  },
  "content_logic": {
    value0: "Value 0: Logische Argumentation",
    value1_2_3: "Value 1,2,3: Logische Argumentation",
  },
  "content_objective_no_hate_no_panic": {
    value0: "Value 0: Objektivität des Beitrags",
    value1_2_3: "Value 1,2,3: Objektivität des Beitrags",
  },
  "content_references": {
    value0: "Value 0: Darstellung des Gesamtbildes",
    value1_2_3: "Value 1,2,3: Darstellung des Gesamtbildes",
  },
  "content_rhetorical_manipulation": {
    value0: "Value 0: Rhetorische Manipulationstechniken",
    value1_2_3: "Value 1,2,3: Rhetorische Manipulationstechniken",
  },
  "content_sources": {
    value0: "Value 0: Autor*in des Beitrags",
    value1_2_3: "Value 1,2,3: Autor*in des Beitrags",
  },

  "media_no_ai_or_staging_doubts": {
    value0: "Value 0: Darstellung von Bilder und Videos",
    value1_2_3: "Value 1,2,3: Darstellung von Bilder und Videos",
  },
  "media_objectivity": {
    value0: "Value 0: Objektivität der Bilder und Videos",
    value1_2_3: "Value 1,2,3: Objektivität der Bilder und Videos",
  },
  "media_visualization_data_traceable": {
    value0: "Value 0: Daten der Visualisierungen",
    value1_2_3: "Value 1,2,3: Daten der Visualisierungen",
  },
  "media_visualizations_not_distorted": {
    value0: "Value 0: Einsatz von Visualisierungen",
    value1_2_3: "Value 1,2,3: Einsatz von Visualisierungen",
  },

  "quotes_context_accurate": {
    value0: "Value 0: Zitate im Kontext",
    value1_2_3: "Value 1,2,3: Zitate im Kontext",
  },
  "quotes_identifiable_persons": {
    value0: "Value 0: Identifizierbare Personen werden zitiert",
    value1_2_3: "Value 1,2,3: Identifizierbare Personen werden zitiert",
  },

  "source_claims_match_originals": {
    value0: "Value 0: Originalquellen",
    value1_2_3: "Value 1,2,3: Originalquellen",
  },
  "source_claims_supported": {
    value0: "Value 0: Quellen belegen Behauptungen",
    value1_2_3: "Value 1,2,3: Quellen belegen Behauptungen",
  },
  "quotes_experts_reputation": {
    value0: "Value 0: Ruf der Expert*innen",
    value1_2_3: "Value 1,2,3: Ruf der Expert*innen",
  },
  "source_experts_verified": {
    value0: "Value 0: Expert*innen besitzen Expertise im Themengebiet",
    value1_2_3: "Value 1,2,3: Expert*innen besitzen Expertise im Themengebiet",
  },
  "source_listed_and_verifiable": {
    value0: "Value 0: Quellen vollständig und nachprüfbar",
    value1_2_3: "Value 1,2,3: Quellen vollständig und nachprüfbar",
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
