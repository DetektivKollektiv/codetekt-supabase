/**
 * Default tags for fields without specific mappings.
 */
export const DEFAULT_FIELD_TAGS = {
  0: "Sehr gut",
  1: "Gut",
  2: "Mangelhaft",
  3: "Ungenügend",
};

/**
 * Default tags mapping for aggregation fields.
 * Maps field_id to quality labels for values 0-3.
 *
 * These labels are shown in the frontend based on the aggregated score.
 * Lower numbers (0-1) indicate better quality, higher numbers (2-3) indicate issues.
 * Note: Option 4 ("not applicable") is used for filtering but not included in final output.
 */
export const FIELD_TAGS: Record<
  string,
  { 0: string; 1: string; 2: string; 3: string }
> = {
  content_logic: {
    0: "Keine Fehlschlüsse",
    1: "Kleinere Fehlschlüsse",
    2: "Offensichtliche Fehlschlüsse",
    3: "Schwere Fehlschlüsse",
  },
  content_clarity: {
    0: "Immer angegeben",
    1: "Meist angegeben",
    2: "Selten angegeben",
    3: "Nie angegeben",
  },
  content_sources: {
    0: "Hochqualifiziert",
    1: "Qualifiziert",
    2: "Wenig qualifiziert",
    3: "Nicht qualifiziert",
  },
  content_accuracy: {
    0: "Ausgewogen",
    1: "Überwiegend ausgewogen",
    2: "Einseitig",
    3: "Stark einseitig",
  },
  content_language: {
    0: "Fehlerfrei",
    1: "Kleinere Fehler",
    2: "Mehrere Fehler",
    3: "Viele Fehler",
  },
  content_references: {
    0: "Vollständig",
    1: "Überwiegend vollständig",
    2: "Wichtiges fehlt",
    3: "Unvollständig",
  },
  content_advertising: {
    0: "Frei von Werbung",
    1: "Kaum Werbung",
    2: "Enthält Werbung",
    3: "Stark werblich",
  },
  media_objectivity: {
    0: "Vollständig objektiv",
    1: "Überwiegend objektiv",
    2: "Teilweise subjektiv",
    3: "Stark subjektiv",
  },
  media_no_ai_or_staging_doubts: {
    0: "Keine Zweifel",
    1: "Geringe Zweifel",
    2: "Deutliche Zweifel",
    3: "Starke Zweifel",
  },
  media_no_obvious_editing: {
    0: "Keine Manipulation",
    1: "Kleinere Bearbeitung",
    2: "Deutliche Bearbeitung",
    3: "Starke Manipulation",
  },
  media_visualizations_not_distorted: {
    0: "Korrekt dargestellt",
    1: "Leicht verzerrt",
    2: "Deutlich verzerrt",
    3: "Stark verzerrt",
  },
  media_visualization_data_traceable: {
    0: "Vollständig nachvollziehbar",
    1: "Überwiegend nachvollziehbar",
    2: "Teilweise nachvollziehbar",
    3: "Nicht nachvollziehbar",
  },
  source_claims_supported: {
    0: "Vollständig belegt",
    1: "Überwiegend belegt",
    2: "Teilweise belegt",
    3: "Nicht belegt",
  },
  source_listed_and_verifiable: {
    0: "Vollständig aufgeführt",
    1: "Überwiegend aufgeführt",
    2: "Teilweise aufgeführt",
    3: "Nicht aufgeführt",
  },
  source_claims_match_originals: {
    0: "Vollständige Übereinstimmung",
    1: "Überwiegend übereinstimmend",
    2: "Teilweise abweichend",
    3: "Stark abweichend",
  },
  source_experts_verified: {
    0: "Nachgewiesene Expertise",
    1: "Wahrscheinliche Expertise",
    2: "Fragliche Expertise",
    3: "Keine Expertise",
  },
  source_experts_reputation: {
    0: "Sehr guter Ruf",
    1: "Guter Ruf",
    2: "Fragwürdiger Ruf",
    3: "Schlechter Ruf",
  },
  quotes_identifiable_persons: {
    0: "Klar identifizierbar",
    1: "Überwiegend identifizierbar",
    2: "Schwer identifizierbar",
    3: "Nicht identifizierbar",
  },
  quotes_context_accurate: {
    0: "Kontext vollständig korrekt",
    1: "Kontext überwiegend korrekt",
    2: "Kontext teilweise verzerrt",
    3: "Kontext stark verzerrt",
  },
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
