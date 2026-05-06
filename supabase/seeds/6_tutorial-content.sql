-- ============================================
-- SEED: Tutorial Content
-- ============================================

insert into public.tutorial_content (id, content)
values (
  1,
  '{
    "faqItems": [
      {
        "id": "faq-platform",
        "title": "Was ist die codetekt Trust-Checking-Plattform?",
        "answerHtml": "Die Trust-Checking-Plattform ist eine community-basierte Plattform, auf der sich alle beteiligen können, um die Vertrauenswürdigkeit digitaler Inhalte gemeinsam zu bewerten."
      },
      {
        "id": "faq-purpose",
        "title": "Wozu dient die Plattform?",
        "answerHtml": "Sie soll dabei helfen, Desinformation zu reduzieren und zu besserer Nachrichtenkompetenz, konstruktiveren Debatten und einer informierteren Öffentlichkeit beizutragen."
      },
      {
        "id": "faq-participation",
        "title": "Wer kann mitmachen?",
        "answerHtml": "Es können sich alle registrieren, die sich gegen Desinformation und für eine besser informierte Öffentlichkeit engagieren wollen. Nutzende, die wiederholt gegen die Nutzungsbedingungen verstoßen, können von der Nutzung ausgeschlossen werden."
      },
      {
        "id": "faq-main-functions",
        "title": "Welche Hauptfunktionen gibt es?",
        "answerHtml": "<p>Es gibt drei grundlegende Bereiche:</p><ul><li>Fall einreichen</li><li>Fall checken</li><li>Gelöste Fälle einsehen (Archiv)</li></ul>"
      },
      {
        "id": "faq-submit-case",
        "title": "Wie reiche ich einen Fall ein?",
        "answerHtml": "<p>Du erstellst einen Account und klickst in der Navigation auf <strong>Fall einreichen</strong>. Dann gibt es zwei Fälle:</p><ul><li><strong>Online-Artikel:</strong> Link zum Artikel angeben</li><li><strong>Textnachricht</strong> (z. B. WhatsApp/Telegram): Text ins Textfeld kopieren</li></ul><p>Danach einfach auf <strong>Fall einreichen</strong> klicken.</p>"
      },
      {
        "id": "faq-solved-cases",
        "title": "Kann ich auch gelöste Fälle bearbeiten?",
        "answerHtml": "Ja. Du kannst nicht nur neue eingereichte Fälle bearbeiten, sondern auch im Archiv (<strong>Gelöste Fälle</strong>) stöbern und dort ebenfalls Bewertungen abgeben."
      },
      {
        "id": "faq-needed-cases",
        "title": "Wie finde ich Fälle, die gerade Mitarbeit brauchen?",
        "answerHtml": "Über <strong>Fall bearbeiten</strong> in der Navigation bekommst du Vorschläge für Fälle, die deine Mitarbeit benötigen."
      },
      {
        "id": "faq-case-title",
        "title": "Wie kommt der Titel eines Falls zustande?",
        "answerHtml": "Die erste Person, die einen Fall checkt, kann den Titel vergeben. Spätere co:detectives können den Titel beanstanden. Bei einer Beanstandung wird der Titel gemeldet, das Moderationsteam prüft die Beanstandung und passt den Titel gegebenenfalls an."
      },
      {
        "id": "faq-keywords",
        "title": "Wofür sind Stichwörter da - und wie viele kann ich vergeben?",
        "answerHtml": "<p>Stichwörter helfen, schnell zu erfassen, worum es im Fall geht:</p><ul><li>Jede*r co:detective kann bis zu 3 Stichwörter vergeben.</li><li>Wenn schon genug gute Stichwörter vorhanden sind, musst du keine hinzufügen.</li></ul><p>Wichtig: neutral und beschreibend bleiben.</p>"
      },
      {
        "id": "faq-content-type",
        "title": "Was bedeutet Inhaltstyp und welche gibt es?",
        "answerHtml": "<p>Der Inhaltstyp wird von der ersten Person, die den Fall bearbeitet, festgelegt. Danach bekommt man passende Fragen. Genannt werden:</p><ul><li><strong>Textnachricht:</strong> z. B. Messenger-Weiterleitungen oder Social-Media-Posts</li><li><strong>Meinung:</strong> Kommentare, Glossen, Essays etc.</li><li><strong>Bericht:</strong> informierende journalistische Formen, wenn nicht klar als Meinung gekennzeichnet</li><li><strong>Satire:</strong> beendet die Bewertung; wird im Archiv als Satire markiert</li></ul>"
      },
      {
        "id": "faq-trust-checking-criteria",
        "title": "Was sind die Trust-Checking-Kriterien?",
        "answerHtml": "<p>Die Trust-Checking-Kriterien sind 5 übergreifende Bereiche, die beim Checken eines Falles geprüft werden:</p><ul><li>Inhalt</li><li>Bilder/Videos</li><li>Quelle</li><li>Zitate</li><li>Medium</li></ul><p>Beim Check werden zu jedem Kriterium mehrere Aussagen auf einer Skala von grün (vertrauenswürdig) bis rot (nicht vertrauenswürdig) bewertet.</p>"
      },
      {
        "id": "faq-colors",
        "title": "Was bedeuten die Farben (Grün bis Grau)?",
        "answerHtml": "<p>Die Antwortoptionen werden so erklärt:</p><ul><li><strong>Grün:</strong> trifft zu oder kleine Mängel ohne relevante Auswirkung</li><li><strong>Gelb:</strong> trifft nicht ganz zu, beeinträchtigt aber nur gering</li><li><strong>Orange:</strong> trifft nicht zu und beeinträchtigt die Vertrauenswürdigkeit</li><li><strong>Rot:</strong> trifft nicht zu und macht den Fall insgesamt nicht vertrauenswürdig</li><li><strong>Grau:</strong> nicht anwendbar oder unsicher</li></ul>"
      },
      {
        "id": "faq-additional-points",
        "title": "Kann ich zusätzliche Punkte anmerken, die nicht abgefragt wurden?",
        "answerHtml": "Ja. Die letzte Frage eines Falls bietet laut Seite die Möglichkeit, weitere Punkte aufzunehmen. Wenn du dort gelb, orange oder rot wählst, kannst du die negativen Punkte in einem Textfeld begründen."
      },
      {
        "id": "faq-final-comment",
        "title": "Was ist der Abschlusskommentar?",
        "answerHtml": "Nach der Bewertung kannst du einen abschließenden Kommentar hinzufügen, um deine Einschätzung zusammenzufassen oder zusätzliche Aspekte zu nennen. Dieser Kommentar gibt Kontext, wird aber nicht in die Gesamtbewertung eingerechnet."
      },
      {
        "id": "faq-archive",
        "title": "Was sehe ich im Archiv (Gelöste Fälle)?",
        "answerHtml": "<p>Im Archiv findest du:</p><ul><li>eine Übersicht gelöster Fälle</li><li>eine Suchfunktion, z. B. nach Stichworten</li><li>pro Fall die Gesamtbewertung und wichtigste Kriterien</li><li>über <strong>Fall ansehen</strong> Details zum Fall</li></ul>"
      },
      {
        "id": "faq-statement-rating",
        "title": "Wie entsteht die Bewertung einer einzelnen Aussage?",
        "answerHtml": "Die Vertrauenswürdigkeit einer Aussage ergibt sich aus dem Durchschnitt der Bewertungen der co:detectives (Grün = 1, Rot = 4; dazwischen entsprechend). Liegt das Ergebnis genau zwischen zwei Stufen, wird die weniger vertrauenswürdige Stufe genommen."
      },
      {
        "id": "faq-criterion-rating",
        "title": "Wie wird ein ganzes Kriterium bewertet?",
        "answerHtml": "Ein Kriterium wird durch die am schlechtesten bewertete Aussage in diesem Kriterium bestimmt. Zum Beispiel führt eine orange bewertete Aussage dazu, dass das Kriterium insgesamt orange ist."
      },
      {
        "id": "faq-overall-rating",
        "title": "Wie entsteht die Gesamtbewertung eines Falls?",
        "answerHtml": "Die Gesamt-Vertrauenswürdigkeit eines Falls entspricht dem am schlechtesten bewerteten Kriterium. Wenn also nur <strong>Quelle</strong> orange ist, wird der ganze Fall orange angezeigt - auch wenn alles andere grün ist."
      },
      {
        "id": "faq-discord",
        "title": "Wo kann ich mich mit anderen austauschen oder mehr über die Zusammenarbeit erfahren?",
        "answerHtml": "In unserem Discord-Channel kannst du dich mit anderen co:detectives austauschen, Fragen stellen und Feedback hinterlassen. <a href=\"https://discord.gg/fFABTPSxXA\" target=\"_blank\" rel=\"noopener noreferrer\">Hier geht's zum Discord</a>."
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
      "title": "Tausche dich mit der Community aus",
      "description": "Auf unserem Discord-Server kannst du dich mit anderen co:detectives und dem codetekt-Team austauschen, Fragen stellen und aktiv werden!",
      "buttonLabel": "Tritt dem codetekt community-Discord-Server bei!",
      "url": "https://discord.gg/fFABTPSxXA",
      "illustrationSrc": "/images/community-people.svg",
      "illustrationAlt": "Illustration einer Community"
    }
  }'::jsonb
)
on conflict (id) do update
set
  content = excluded.content,
  updated_at = now();
