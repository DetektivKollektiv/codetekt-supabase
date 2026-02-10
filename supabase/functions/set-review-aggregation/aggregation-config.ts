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
  "media_no_obvious_editing": "Bearbeitung der Bilder",
  "media_objectivity": "Objektivität der Bilder und Videos",
  "media_visualization_data_traceable": "Daten der Visualisierungen",
  "media_visualizations_not_distorted": "Einsatz von Visualisierungen",

  "quotes_context_accurate": "Zitate im Kontext",
  "quotes_identifiable_persons": "Identifizierbare Personen werden zitiert",

  "source_claims_match_originals": "Originalquellen",
  "source_claims_supported": "Quellen belegen Behauptungen",
  "source_experts_reputation": "Ruf der Expert*innen",
  "source_experts_verified": "Expert*innen besitzen Expertise im Themengebiet",
  "source_listed_and_verifiable": "Quellen vollständig und nachprüfbar",
};

export const QUESTION_ICONS: Record<
  string,
  string
> = {
  content_question: "notebook-text",
  additional_comment_question: "message-square-text",
  media_question: "image",
  source_question: "link-2",
  quotes_question: "quote",
};

export const SKIPPED_QUESTION_IDS = [
  "evaluation_criteria_question",
  "submit_question",
  "additional_rating",
];

export const METADATA_QUESTION_IDS = [
  "title_question",
  "keywords_question",
  "content_type_question",
];
/*         "options": [
          {
            "id": "satire",
            "text": "Satire"
          },
          {
            "id": "neutral",
            "text": "Neutral"
          },
          {
            "id": "text_message",
            "text": "Textnachricht"
          },
          {
            "id": "opinion",
            "text": "Meinung"
          }
        ], */

export const CONTENT_TYPE_NATURALTEXT: Record<string, string> = {
  "satire": "Satire",
  "neutral": "Neutral",
  "text_message": "Textnachricht",
  "opinion": "Meinung",
};
