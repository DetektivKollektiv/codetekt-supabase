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

Ein Review muss alle 24 Antworten enthalten. Die Kategorie ist Bestandteil der
Frage-ID; die API verarbeitet keine separaten Kategorieobjekte.

```json
{
  "answers": {
    "content_manipulated_or_deepfake": 0,
    "content_false_context": 1,
    "content_missing_context": 2,
    "content_advertising": 3,
    "content_one_sided": 0,
    "content_illogical_or_contradictory": 0,
    "content_clickbait": 1,
    "tone_emotionalized": 1,
    "tone_inflammatory": 2,
    "tone_distracting": 0,
    "tone_generalizing": 1,
    "tone_polarizing": 2,
    "account_anonymous": 0,
    "account_unreliable": 1,
    "account_not_objective": 0,
    "account_not_independent": 0,
    "external_sources_missing": 3,
    "external_sources_not_verifiable": 2,
    "external_sources_false_context": 1,
    "external_sources_forged": 0,
    "external_sources_missing_context": 1,
    "external_sources_not_expert": 0,
    "external_sources_factually_incorrect": 2,
    "external_sources_heavily_abridged": 1
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

| Kategorie       | Frage-ID                               | Anzeige                   |
| --------------- | -------------------------------------- | ------------------------- |
| Inhalt          | `content_manipulated_or_deepfake`      | Manipuliert/Deepfake      |
| Inhalt          | `content_false_context`                | Falscher Kontext          |
| Inhalt          | `content_missing_context`              | Fehlender Kontext         |
| Inhalt          | `content_advertising`                  | Werbung                   |
| Inhalt          | `content_one_sided`                    | Einseitig                 |
| Inhalt          | `content_illogical_or_contradictory`   | Unlogisch/widersprüchlich |
| Inhalt          | `content_clickbait`                    | Clickbait                 |
| Tonfall         | `tone_emotionalized`                   | Emotionalisiert           |
| Tonfall         | `tone_inflammatory`                    | Hetzerisch                |
| Tonfall         | `tone_distracting`                     | Ablenkend                 |
| Tonfall         | `tone_generalizing`                    | Pauschalisierend          |
| Tonfall         | `tone_polarizing`                      | Polarisierend             |
| Account         | `account_anonymous`                    | Anonym                    |
| Account         | `account_unreliable`                   | Unseriös                  |
| Account         | `account_not_objective`                | Nicht objektiv            |
| Account         | `account_not_independent`              | Nicht unabhängig          |
| Externe Quellen | `external_sources_missing`             | Nicht vorhanden           |
| Externe Quellen | `external_sources_not_verifiable`      | Nicht nachprüfbar         |
| Externe Quellen | `external_sources_false_context`       | Falscher Kontext          |
| Externe Quellen | `external_sources_forged`              | Gefälscht                 |
| Externe Quellen | `external_sources_missing_context`     | Fehlender Kontext         |
| Externe Quellen | `external_sources_not_expert`          | Nicht vom Fach            |
| Externe Quellen | `external_sources_factually_incorrect` | Inhaltlich falsch         |
| Externe Quellen | `external_sources_heavily_abridged`    | Stark gekürzt             |

Jedes veröffentlichte Aggregat enthält alle 24 Fragen in dieser Reihenfolge.
Das Frontend ordnet sie anhand der ID einer Kategorie und einem Anzeigetext zu.
Eine Frage mit einem Durchschnitt über `0` wird in der Farbe ihres
aufgerundeten Levels angezeigt. Sind alle Fragen einer Kategorie `0`, kann das
Frontend dort „Alles passt“ anzeigen.

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
IDs selbst werden nicht ausgegeben. Der Endpunkt berechnet nichts neu.

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
