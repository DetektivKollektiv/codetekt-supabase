/**
 * Default tags mapping for aggregation fields.
 * Maps field_id to quality labels for values 0-4.
 *
 * These labels are shown in the frontend based on the aggregated score.
 * Lower numbers (0-1) indicate better quality, higher numbers (2-3) indicate issues.
 * Value 4 is always "Nicht zutreffend" (not applicable).
 */
export const DEFAULT_FIELD_TAGS: Record<
  string,
  { 0: string; 1: string; 2: string; 3: string; 4: string }
> = {
  content_logic: {
    0: "Keine Fehlschlüsse",
    1: "Kleinere Fehlschlüsse",
    2: "Offensichtliche Fehlschlüsse",
    3: "Schwere Fehlschlüsse",
    4: "Nicht zutreffend",
  },
  content_clarity: {
    0: "Immer angegeben",
    1: "Meist angegeben",
    2: "Selten angegeben",
    3: "Nie angegeben",
    4: "Nicht zutreffend",
  },
  content_sources: {
    0: "Hochqualifiziert",
    1: "Qualifiziert",
    2: "Wenig qualifiziert",
    3: "Nicht qualifiziert",
    4: "Nicht zutreffend",
  },
  content_accuracy: {
    0: "Ausgewogen",
    1: "Überwiegend ausgewogen",
    2: "Einseitig",
    3: "Stark einseitig",
    4: "Nicht zutreffend",
  },
  content_language: {
    0: "Fehlerfrei",
    1: "Kleinere Fehler",
    2: "Mehrere Fehler",
    3: "Viele Fehler",
    4: "Nicht zutreffend",
  },
  content_references: {
    0: "Vollständig",
    1: "Überwiegend vollständig",
    2: "Wichtiges fehlt",
    3: "Unvollständig",
    4: "Nicht zutreffend",
  },
  content_advertising: {
    0: "Frei von Werbung",
    1: "Kaum Werbung",
    2: "Enthält Werbung",
    3: "Stark werblich",
    4: "Nicht zutreffend",
  },
};
