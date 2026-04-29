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
        "id": "tutorial-article-platform",
        "url": "https://codetekt.org/informationen/die-codetekt-trust-checking-plattform-erklart/",
        "title": "Die codetekt Trust-Checking-Plattform erklärt",
        "description": "Du willst dich digital gegen Desinformation engagieren? Dann ist die Trust-Checking-Plattform genau das, wonach du suchst.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2025/05/codetekt_blog-artikel-fact-checking-1.jpg",
        "imageAlt": "Die codetekt Trust-Checking-Plattform erklärt",
        "publishedAt": "2026-03-17T10:55:24+00:00",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-content",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-inhalt/",
        "title": "Trust-Checking im Detail: Inhalt - Was steckt wirklich in der Nachricht",
        "description": "Ein Beitrag macht dich stutzig? Gut so! Dieses Bauchgefühl ist oft dein wichtigster Schutz vor Desinformation und Falschnachrichten.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2026/02/codetekt_blog-artikel-trust-checking-kriterien-inhalte-scaled.jpg",
        "imageAlt": "Trust-Checking im Detail: Inhalt - Was steckt wirklich in der Nachricht",
        "publishedAt": "2026-02-19T11:55:22+00:00",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-media",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-bilder-videos-und-grafiken/",
        "title": "Trust-Checking im Detail: Bilder, Videos und Grafiken - codetekt",
        "description": "Ein Beitrag macht dich stutzig? Gut so! Dieses Bauchgefühl ist oft dein wichtigster Schutz vor Desinformation und Falschnachrichten.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2026/02/codetekt_blog-artikel-trust-checking-kriterien-bilder-videos-scaled.jpg",
        "imageAlt": "Trust-Checking im Detail: Bilder, Videos und Grafiken - codetekt",
        "publishedAt": "2026-02-19T11:54:19+00:00",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-medium",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-medium/",
        "title": "Trust-Checking im Detail: Medium - Wo ist der Beitrag erschienen?",
        "description": "Ein Beitrag macht dich stutzig? Gut so! Dieses Bauchgefühl ist oft dein wichtigster Schutz vor Desinformation und Falschnachrichten.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2026/02/codetekt_blog-artikel-trust-checking-kriterien-medium-scaled.jpg",
        "imageAlt": "Trust-Checking im Detail: Medium - Wo ist der Beitrag erschienen?",
        "publishedAt": "2026-02-26T09:34:50+00:00",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-source",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-quelle/",
        "title": "Trust-Checking im Detail: Quelle - Wer steckt hinter dem Beitrag? - codetekt",
        "description": "Ein Beitrag macht dich stutzig? Gut so! Dieses Bauchgefühl ist oft dein wichtigster Schutz vor Desinformation und Falschnachrichten.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2026/02/codetekt_blog-artikel-trust-checking-kriterien-quelle-scaled.jpg",
        "imageAlt": "Trust-Checking im Detail: Quelle - Wer steckt hinter dem Beitrag? - codetekt",
        "publishedAt": "2026-02-19T11:53:52+00:00",
        "siteName": "codetekt",
        "buttonLabel": "Artikel lesen"
      },
      {
        "id": "tutorial-article-quotes",
        "url": "https://codetekt.org/informationen/trust-checking-im-detail-zitate/",
        "title": "Trust-Checking im Detail: Zitate - wer sagt was? - codetekt",
        "description": "Ein Beitrag macht dich stutzig? Gut so! Dieses Bauchgefühl ist oft dein wichtigster Schutz vor Desinformation und Falschnachrichten.",
        "imageUrl": "https://codetekt.org/wp-content/uploads/2026/02/codetekt_blog-artikel-trust-checking-kriterien-zitate-scaled.jpg",
        "imageAlt": "Trust-Checking im Detail: Zitate - wer sagt was? - codetekt",
        "publishedAt": "2026-02-19T11:53:40+00:00",
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
