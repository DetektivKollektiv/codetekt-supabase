# Wedium Community Checks API

Status: technische v1-Spezifikation mit provisorischem Fragenkatalog.

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

## Provisorischer Fragenkatalog

Ein Review muss exakt diese fünf Antworten enthalten:

```json
{
  "answers": {
    "placeholder_question_1": 0,
    "placeholder_question_2": 1,
    "placeholder_question_3": 2,
    "placeholder_question_4": 3,
    "placeholder_question_5": 4
  }
}
```

Die Werte entsprechen der Plattform:

| Wert | Bedeutung       |
| ---- | --------------- |
| `0`  | Grün            |
| `1`  | Gelb            |
| `2`  | Orange          |
| `3`  | Rot             |
| `4`  | Nicht anwendbar |

`4` wird nicht in Mittelwert und Prozentverteilung eingerechnet. Wählen
mindestens 50 Prozent bei einer Frage `4`, entfällt diese Frage aus dem
Aggregationsergebnis.

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

Body: vollständiges `answers`-Objekt aus dem provisorischen Fragenkatalog.

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

## Aktualität und Revisionen

Jede Review-Änderung erhöht die interne `review_revision` des Posts. Ein Worker
darf sein Aggregat nur speichern, wenn diese Revision noch seiner
`source_revision` entspricht. Verspätete Worker können daher kein neueres
Ergebnis überschreiben.

- Nach einem PUT bleibt das letzte erfolgreich berechnete Aggregat sichtbar, bis
  ein aktueller Worker es ersetzt.
- Nach einem DELETE wird das alte Aggregat sofort entfernt. Es bleibt `missing`,
  bis ein aktuelles Aggregat aus mindestens zwei Reviews vorliegt.
- Worker führen keine eigenen Retries aus. Jede Review-Änderung löst einen neuen
  Worker aus.
- Schlägt der Webhook oder Worker fehl, bleibt nach PUT der alte Stand und nach
  DELETE der `missing`-Zustand bestehen, bis eine spätere Änderung erneut einen
  Worker auslöst.
