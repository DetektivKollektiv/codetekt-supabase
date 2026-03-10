export const DEFAULT_FIELD_TAG = "Fall";

export const FIELD_TAGS: Record<string, string> = {
  "content_accuracy": "Darstellung unterschiedlicher Positionen",
  "content_advertising": "Werbefreier Beitrag",
  "content_claims_not_debunked": "Factchecking des Beitrags",
  "content_clarity": "Aussagekraft der Informationen",
  "content_headline_matches_article": "Passende Überschrift",
  "content_language": "Grammatik und Rechtschreibung",
  "content_logic": "Logische Argumentation",
  "content_objective_no_hate_no_panic": "Objektivität des Beitrags",
  "content_references": "Darstellung des Gesamtbildes",
  "content_rhetorical_manipulation": "Rhetorische Manipulationstechniken",
  "content_sources": "Autor*in des Beitrags",

  "media_no_ai_or_staging_doubts": "Darstellung von Bilder und Videos",
  "media_objectivity": "Objektivität der Bilder und Videos",
  "media_visualization_data_traceable": "Daten der Visualisierungen",
  "media_visualizations_not_distorted": "Einsatz von Visualisierungen",

  "quotes_context_accurate": "Zitate im Kontext",
  "quotes_identifiable_persons": "Identifizierbare Personen werden zitiert",

  "source_claims_match_originals": "Originalquellen",
  "source_claims_supported": "Quellen belegen Behauptungen",
  "quotes_experts_reputation": "Ruf der Expert*innen",
  "source_experts_verified": "Expert*innen besitzen Expertise im Themengebiet",
  "source_listed_and_verifiable": "Quellen vollständig und nachprüfbar",
};

export const QUESTION_ICONS: Record<
  string,
  string
> = {
  content_question: "notebook-text",
  media_question: "image",
  source_question: "link-2",
  quotes_question: "quote",
};

export const SKIPPED_QUESTION_IDS = [
  "submit_question",
];
