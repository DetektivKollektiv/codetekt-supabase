-- ============================================
-- SEED: Tutorial Content
-- ============================================

insert into public.tutorial_content (id, content)
values (
  1,
  '{
    "faqItems": [
      {
        "id": "faq-review-start",
        "title": "Wie starte ich mit dem Prüfen eines Falls?",
        "answerHtml": "Gehe in deinem Dashboard zu den offenen Fällen und öffne einen Fall mit <strong>Fall checken</strong>. Eine ausführliche Einführung findest du auch im <a href=\"https://codetekt.org/informationen/trust-checking-im-detail-inhalt/\" target=\"_blank\" rel=\"noopener noreferrer\">Help Center</a>."
      },
      {
        "id": "faq-trust-checking",
        "title": "Was ist Trust-Checking?",
        "answerHtml": "Trust-Checking ist der Ansatz von codetekt, um Informationen anhand klarer Kriterien einzuordnen. Die fünf Bereiche werden in den verlinkten Artikeln Schritt für Schritt erklärt."
      },
      {
        "id": "faq-community",
        "title": "Wo kann ich Fragen an die Community stellen?",
        "answerHtml": "Nutze den Community-Link im Tutorial, um mit anderen Detektiv*innen in Kontakt zu kommen. Bis der finale Discord-Link steht, ist dort zunächst ein Platzhalter hinterlegt."
      },
      {
        "id": "faq-factcheck",
        "title": "Was mache ich, wenn es bereits einen Faktencheck gibt?",
        "answerHtml": "Im Review kannst du im Bereich <strong>Faktencheck</strong> angeben, ob bereits ein Faktencheck existiert. Für einen Überblick zu passenden Quellen hilft dir zum Beispiel die Recherche über bekannte Faktencheck-Angebote oder die Hinweise im <a href=\"https://codetekt.org/informationen/trust-checking-im-detail-quelle/\" target=\"_blank\" rel=\"noopener noreferrer\">Artikel zur Quelle</a>."
      }
    ],
    "blogArticles": [
      {
        "id": "tutorial-article-content",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-inhalt/",
        "title": "Trust-Checking im Detail: Inhalt",
        "description": "Worauf du bei Sprache, Dramatisierung und der eigentlichen Aussage eines Beitrags achten solltest.",
        "imageUrl": "/images/lady-detective.svg",
        "imageAlt": "Illustration einer Detektivin",
        "publishedAt": "2026-04-29",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-media",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-bilder-videos-und-grafiken/",
        "title": "Trust-Checking im Detail: Bilder, Videos und Grafiken",
        "description": "Lerne, wie du visuelle Manipulationen, aus dem Kontext gerissene Medien und fragwürdige Grafiken erkennst.",
        "imageUrl": "/images/projekte.svg",
        "imageAlt": "Illustration zu Medien und Projekten",
        "publishedAt": "2026-04-29",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-medium",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-medium/",
        "title": "Trust-Checking im Detail: Medium",
        "description": "Prüfe, wie transparent ein Medium arbeitet und ob es Hinweise auf Interessen oder fehlende Unabhängigkeit gibt.",
        "imageUrl": "/images/title.svg",
        "imageAlt": "Illustration zum codetekt Titel",
        "publishedAt": "2026-04-29",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-source",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-quelle/",
        "title": "Trust-Checking im Detail: Quelle",
        "description": "So bewertest du, ob Behauptungen nachvollziehbar belegt sind und wie du Quellen besser einschätzt.",
        "imageUrl": "/images/unterstuetzen.svg",
        "imageAlt": "Illustration mit unterstützenden Elementen",
        "publishedAt": "2026-04-29",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-quotes",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-zitate/",
        "title": "Trust-Checking im Detail: Zitate",
        "description": "Erfahre, wie du Zitate auf Herkunft, Vollständigkeit und korrekte Wiedergabe überprüfst.",
        "imageUrl": "/images/community-people.svg",
        "imageAlt": "Illustration einer Community",
        "publishedAt": "2026-04-29",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      }
    ],
    "communityCard": {
      "title": "Fragen? Tausche dich mit der Community aus",
      "description": "Wenn du Hilfe brauchst oder dich mit anderen Detektiv*innen austauschen möchtest, findest du hier den Einstieg in den Community-Bereich.",
      "buttonLabel": "Zum Discord",
      "url": "https://example.com/discord",
      "illustrationSrc": "/images/community-people.svg",
      "illustrationAlt": "Illustration einer Community"
    }
  }'::jsonb
)
on conflict (id) do update
set
  content = excluded.content,
  updated_at = now();
