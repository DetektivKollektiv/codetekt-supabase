-- ============================================
-- Review Template Version 1
-- ============================================

INSERT INTO public.review_templates (version, template, created_by)
VALUES (
  1,
  '[
  {
    "id": "keywords_question",
    "metadata": {
      "title": "Stichwörter",
      "text": "Du hast die Bearbeitung dieses Falls gestartet. Bitte lies dir alle Aussagen durch und bewerte sie sorgfältig.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "keyword_type",
        "type": "multi-line-text",
        "question": "Fehlen Stichwörter?",
        "options": [],
        "additonal_option_count": 5,
        "max_length": 50,
        "placeholder": "Stichwort hinzufügen...",
        "is_required": true
      }
    ]
  },
  {
    "id": "content_type_question",
    "metadata": {
      "title": "Inhaltstyp",
      "text": "Du hast die Bearbeitung dieses Falls gestartet. Bitte lies dir alle Aussagen durch und bewerte sie sorgfältig.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "content_type",
        "type": "chip",
        "question": "Worum handelt es sich bei dem Fall?",
        "options": [
          { "id": "nachrichtenartikel", "text": "Nachrichtenartikel" },
          { "id": "chat_post", "text": "Chatnachricht/Social Media Post" },
          { "id": "satire", "text": "Satire" },
          { "id": "fake_website", "text": "Fake-Website" },
          { "id": "opinion", "text": "Meinungsbeitrag/Kommentar" },
          { "id": "werbung", "text": "Werbung" },
          { "id": "pressemitteilung", "text": "Pressemitteilung" },
          { "id": "video", "text": "Video" },
          { "id": "bild", "text": "Bild" },
          { "id": "other", "text": "Other" }
        ],
        "prefilled_answer_value": null,
        "is_required": true,
        "is_disabled": false,
        "is_disputable": false
      }
    ]
  },

  {
    "id": "content_criteria_question",
    "metadata": {
      "title": "Inhalte",
      "text": "Bewerte die folgenden Aussagen sorgfältig.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "grammar",
        "type": "traffic-light",
        "options": [
          {
            "id": "grammar_opt",
            "question": "Die Grammatik und Rechtschreibung des Artikels sind fehlerfrei."
          }
        ],
        "is_required": true
      },
      {
        "id": "structure",
        "type": "traffic-light",
        "options": [
          {
            "id": "structure_opt",
            "question": "Der Artikel ist keine Eilnachricht. Er besteht aus mehreren Paragraphen."
          }
        ],
        "is_required": true
      },
      {
        "id": "headline",
        "type": "traffic-light",
        "options": [
          {
            "id": "headline_opt",
            "question": "Die Überschrift passt zum Inhalt des Artikels."
          }
        ],
        "is_required": true
      },
      {
        "id": "objectivity",
        "type": "traffic-light",
        "options": [
          {
            "id": "objectivity_opt",
            "question": "Der Artikel ist objektiv geschrieben und frei von Hetze, Generalisierungen, Panikmache oder Ähnlichem."
          }
        ],
        "is_required": true
      },
      {
        "id": "perspectives",
        "type": "traffic-light",
        "options": [
          {
            "id": "perspectives_opt",
            "question": "Im Artikel werden unterschiedliche Positionen dargestellt."
          }
        ],
        "is_required": true
      }
    ]
  },

  {
    "id": "source_criteria_question",
    "metadata": {
      "title": "Quelle",
      "text": "Bewerte die folgenden Aussagen sorgfältig.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "external_sources",
        "type": "traffic-light",
        "options": [
          {
            "id": "external_sources_opt",
            "question": "Im Artikel werden für alle Behauptungen externe Quellen genannt."
          }
        ],
        "is_required": true
      },
      {
        "id": "claims_match_sources",
        "type": "traffic-light",
        "options": [
          {
            "id": "claims_match_sources_opt",
            "question": "Die Behauptungen des Artikels decken sich vollständig mit denen der Originalquellen."
          }
        ],
        "is_required": true
      },
      {
        "id": "public_media_match",
        "type": "traffic-light",
        "options": [
          {
            "id": "public_media_match_opt",
            "question": "Die Behauptungen des Artikels decken sich mit der Berichterstattung öffentlich-rechtlicher Medien und/oder Fachmedien."
          }
        ],
        "is_required": true
      },
      {
        "id": "author_credentials",
        "type": "traffic-light",
        "options": [
          {
            "id": "author_credentials_opt",
            "question": "Der Artikel ist von einer fachkundigen Person oder einer*m beruflichen Journalist*in geschrieben."
          }
        ],
        "is_required": true
      }
    ]
  },

  {
    "id": "images_question",
    "metadata": {
      "title": "Bilder",
      "text": "Bewerte die Bilder im Artikel.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "images_quality",
        "type": "traffic-light",
        "options": [
          {
            "id": "images_quality_opt",
            "question": "Die Bilder sind relevant und unterstützen den Inhalt."
          }
        ],
        "is_required": true
      }
    ]
  },

  {
    "id": "evaluation_criteria_question",
    "metadata": {
      "title": "Bewertungskriterien",
      "text": "Hinweis: Im Rahmen dieses Tests, kann nur ein *sonstiger* Punkt angegeben werden. Falls du mehrere Punkte angeben willst, wähle bitte den gravierendsten aus. Später wird es die Möglichkeit geben, hier auch mehrere Punkte aufzuführen.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": [
      {
        "id": "additional_rating",
        "type": "likert-scale",
        "question": "Ist dir sonst noch etwas aufgefallen, das in die Bewertung einfliessen sollte?",
        "options": [
          {
            "id": "positive",
            "text": "Ja,",
            "description": "etwas positives",
            "color": "var(--brand-green)",
            "value": 0
          },
          {
            "id": "minor_issue",
            "text": "Ja,",
            "description": "kleiner Mangel",
            "color": "var(--brand-yellow)",
            "value": 1
          },
          {
            "id": "major_issue",
            "text": "Ja,",
            "description": "großer Mangel",
            "color": "var(--brand-orange)",
            "value": 2
          },
          {
            "id": "critical_error",
            "text": "Ja,",
            "description": "gravierender Fehler",
            "color": "var(--brand-coral)",
            "value": 3
          },
          {
            "id": "nothing",
            "text": "Nein,",
            "description": "alles geprüft",
            "color": "var(--gray-400)",
            "value": 4
          }
        ],
        "is_required": true
      }
    ]
  },

  {
    "id": "additional_comment_question",
    "metadata": {
      "title": "Zusatz",
      "text": "Versuche den Faktor möglichst kurz und knapp zu beschreiben. Du hast gleich noch mehr Platz für einen ausführlichen Fallbewertungskommentar.",
      "help_url": "",
      "indent_level": 1
    },
    "fields": [
      {
        "id": "additional_comment",
        "type": "text-area",
        "question": "Was ist dir aufgefallen?",
        "options": [
          {
            "id": "comment_field",
            "placeholder": "Type your answer here...",
            "max_length": 500
          }
        ],
        "is_required": [
          {
            "field_id": "additional_rating",
            "operator": "<",
            "value": 4
          }
        ],
        "is_shown": [
          {
            "field_id": "additional_rating",
            "operator": "<",
            "value": 4
          }
        ]
      }
    ]
  },

  {
    "id": "submit_question",
    "metadata": {
      "title": "Fall abschließen",
      "text": "Überprüfe deine Angaben und schließe den Fall ab.",
      "help_url": "",
      "indent_level": 0
    },
    "fields": []
  }
]
'::jsonb,
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com')
);