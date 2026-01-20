/**
 * Default tags mapping for aggregation fields.
 * Maps field_id to quality labels for values 0-3.
 *
 * These labels are shown in the frontend based on the aggregated score.
 * Lower numbers (0-1) indicate better quality, higher numbers (2-3) indicate issues.
 * Note: Option 4 ("not applicable") is used for filtering but not included in final output.
 */
export const DEFAULT_FIELD_TAGS: Record<
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
};

export const DEFAULT_QUESTION_ICONS: Record<
  string,
  string
> = {
  content_question: "notebook-text",
};

export const SKIPPED_QUESTION_IDS = [
  "evaluation_criteria_question",
  "submit_question",
];

export const METADATA_QUESTION_IDS = [
  "title_question",
  "keywords_question",
  "content_type_question",
];
