# Wedium Community Checks API

Status: technische v1-Spezifikation.

Maschinenlesbarer Vertrag: [WEDIUM_OPENAPI.json](./WEDIUM_OPENAPI.json)

## Grundlagen

- Native Basisroute: `/functions/v1/wedium`
- Authentifizierung: `X-API-Key: <wedium-api-key>`
- `user_hash` und `post_hash`: jeweils 64 kleine Hex-Zeichen
- Pro Nutzer und Post existiert genau ein aktuelles Review.
- Aggregationen werden asynchron ab zwei Reviews berechnet.
- Maximal 100 eindeutige Posts sind pro Aggregationsabfrage erlaubt.

Fehler verwenden dieses Format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid review",
    "issues": []
  }
}
```

Verwendete Statuscodes: `401`, `404`, `405`, `422` und `500`.

## Fragenkatalog

Ein Review muss alle 15 Antworten enthalten. Die Kategorie ist Bestandteil der
Frage-ID; die API verarbeitet keine separaten Kategorieobjekte.

```json
{
  "answers": {
    "content_false_context": 1,
    "content_contradictory": 2,
    "content_covert_advertising": 3,
    "content_clickbait": 1,
    "content_deepfake": 0,
    "presentation_derogatory": 1,
    "presentation_aggressive": 2,
    "presentation_fear_inducing": 0,
    "presentation_generalizing": 1,
    "account_biased": 2,
    "account_unclear_identity": 0,
    "account_impersonated_identity": 1,
    "sources_unreliable": 2,
    "sources_debunked": 3,
    "sources_missing": 1
  }
}
```

Die Werte werden von passend bis zunehmend problematisch bewertet:

| Wert | Bedeutung                   |
| ---- | --------------------------- |
| `0`  | Passt / unauffällig (grün)  |
| `1`  | Leicht problematisch (gelb) |
| `2`  | Problematisch (orange)      |
| `3`  | Stark problematisch (rot)   |

Die API-Skala `0` bis `3` entspricht einer externen Skala `1` bis `4` mit
denselben vier Farbstufen. Beispielsweise ist Rot extern `4` und in der API `3`.
Wedium hat keine zusätzliche Antwort für „nicht anwendbar“.

| Kategorie   | Frage-ID                        | Anzeige                 |
| ----------- | ------------------------------- | ----------------------- |
| Inhalt      | `content_false_context`         | Falscher Kontext        |
| Inhalt      | `content_contradictory`         | Widersprüchlich         |
| Inhalt      | `content_covert_advertising`    | Schleichwerbung         |
| Inhalt      | `content_clickbait`             | Clickbait               |
| Inhalt      | `content_deepfake`              | Deepfake                |
| Darstellung | `presentation_derogatory`       | Abwertend               |
| Darstellung | `presentation_aggressive`       | Aggressiv               |
| Darstellung | `presentation_fear_inducing`    | Angsteinflößend         |
| Darstellung | `presentation_generalizing`     | Pauschalisierend        |
| Account     | `account_biased`                | Voreingenommen          |
| Account     | `account_unclear_identity`      | Unklare Identität       |
| Account     | `account_impersonated_identity` | Vorgetäuschte Identität |
| Quellen     | `sources_unreliable`            | Unseriös                |
| Quellen     | `sources_debunked`              | Widerlegt               |
| Quellen     | `sources_missing`               | Quelle fehlt            |

Jedes veröffentlichte Aggregat enthält alle 15 Fragen in dieser Reihenfolge. Das
Frontend ordnet sie anhand der ID einer Kategorie und einem Anzeigetext zu. Sind
alle Fragen einer Kategorie `0`, kann das Frontend dort „Alles passt“ anzeigen.

## Ergebnisberechnung

Ein Ergebnis wird ab zwei vollständigen Reviews veröffentlicht. Für jede Frage
wird zunächst der Durchschnitt aller Antworten berechnet. Bei zwei bis acht
Reviews wird davon `2 / Anzahl Reviews` abgezogen; ab neun Reviews entfällt die
Korrektur. Der korrigierte Wert wird bei `0` begrenzt und auf zwei
Dezimalstellen gerundet. Das Farb-Level entsteht anschließend durch
kaufmännisches Runden auf `0`, `1`, `2` oder `3`.

Beispiele, wenn alle Reviews eine Frage mit Rot (`3`) beantworten:

| Reviews | Korrektur | Score | Level      |
| ------- | --------- | ----- | ---------- |
| 2       | 1,00      | 2,00  | 2 / Orange |
| 3       | 0,67      | 2,33  | 2 / Orange |
| 4       | 0,50      | 2,50  | 3 / Rot    |
| 8       | 0,25      | 2,75  | 3 / Rot    |
| 9       | 0,00      | 3,00  | 3 / Rot    |

`result_score` ist der höchste korrigierte Score aller Fragen. Die Korrektur
wird nicht noch einmal auf das Gesamtergebnis angewendet.

## Endpunkte

### Aggregationen abrufen

```http
POST /functions/v1/wedium/review-aggregations
```

```json
{
  "post_hashes": [
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  ]
}
```

Die Antwort enthält `results` in der Reihenfolge der Anfrage sowie
`missing_post_hashes`. Ein fehlender Post und ein Post ohne veröffentlichbares
Aggregat gelten beide als `missing`.

Jedes Ergebnis enthält:

- `post_hash`
- `review_count`
- `result_score`
- `result_level`
- `result_code`
- `data.questions`
- `calculated_at`

`review_count` wird aus den intern gespeicherten `reviewer_ids` abgeleitet; die
IDs selbst werden nicht ausgegeben. `result_score`, `data.questions[].score` und
`data.questions[].fields[].average` enthalten den korrigierten Wert. `counts`
und `percentages` zeigen weiterhin die tatsächlich eingegangenen Antworten. Der
Endpunkt berechnet nichts neu.

Bereits gespeicherte Aggregate werden nach einer Änderung der Berechnungslogik
nicht automatisch neu berechnet. Sie werden mit der nächsten Änderung eines
Reviews für den jeweiligen Post aktualisiert.

### Review speichern oder überschreiben

```http
PUT /functions/v1/wedium/users/{user_hash}/reviews/{post_hash}
```

Body: vollständiges `answers`-Objekt aus dem Fragenkatalog.

```json
{
  "saved": true,
  "submitted_at": "2026-08-25T09:00:00.000Z",
  "updated_at": "2026-08-25T09:00:00.000Z"
}
```

User und Post werden bei Bedarf angelegt. Ein weiterer PUT überschreibt das
Review vollständig. `created_at` bleibt erhalten; `submitted_at` und
`updated_at` werden bei jedem erfolgreichen PUT aktualisiert.

### Review abrufen

```http
GET /functions/v1/wedium/users/{user_hash}/reviews/{post_hash}
```

Liefert `post_hash`, `answers`, `submitted_at` und `updated_at`. Ein fehlendes
Review ergibt `404`.

### Review löschen

```http
DELETE /functions/v1/wedium/users/{user_hash}/reviews/{post_hash}
```

```json
{ "deleted": true }
```

Der Endpunkt ist idempotent. Eine Wiederholung liefert `deleted: false`. Der
Wedium-User bleibt bestehen.

### User abrufen

```http
GET /functions/v1/wedium/users/{user_hash}
```

Liefert `user_hash`, `review_count`, `created_at` und `last_reviewed_at`. Ein
fehlender User ergibt `404`.

### User und Reviews löschen

```http
DELETE /functions/v1/wedium/users/{user_hash}
```

```json
{
  "deleted": true,
  "deleted_review_count": 12,
  "affected_post_count": 12
}
```

Die Posts selbst bleiben bestehen. Eine Wiederholung liefert `deleted: false`
und beide Counts als `0`.
