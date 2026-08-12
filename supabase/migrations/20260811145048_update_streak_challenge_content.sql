insert into public.challenge_configs (
  id,
  starts_on,
  ends_on,
  visible_from,
  visible_until,
  content,
  messages
)
values (
  'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef',
  '2026-09-01',
  '2026-09-20',
  '2026-09-01 00:00:00 Europe/Berlin'::timestamptz,
  '2026-09-20 23:59:59.999 Europe/Berlin'::timestamptz,
  $json$
    {
      "eyebrow": "Community Challenge",
      "title": "Trust Barometer",
      "totalTarget": 100,
      "milestones": [0, 50, 100],
      "dailyGoals": [3, 5, 10],
      "descriptionColumnsHtml": [
        "<p>Gemeinsam prüfen wir Nachrichten auf ihre Vertrauenswürdigkeit (Trust-Checks) und machen unsere Ergebnisse sichtbar für andere (Trust-Shares) – online, im persönlichen Umfeld und überall dort, wo Falschinformationen ihre Wellen schlagen!</p>",
        "<p>Unsere Community-Ziele lauten: 1) Daily Streak am Leben halten, also jeden Tag mindestens 1 gemeinsam gelöster Fall (z. B. ein Online-Artikel). 2) Trust-Barometer füllen und 100 Fälle erreichen. 3) So viele Trust-Shares wie möglich! Infos zur Anleitung und den Gewinnen gibt’s <a href=\"/streak_challenge_2026_teilnahmebedingungen\">hier</a>.</p>"
      ],
      "intro": {
        "eyebrow": "Aktion zu den Landtagswahlen 2026",
        "title": "Willkommen zur Streak-Challenge",
        "descriptionHtml": "<p><a href=\"https://www.bundeswahlleiterin.de/service/wahltermine.html\" target=\"_blank\" rel=\"noopener noreferrer\">Im September 2026 stehen mehrere Landtags- und Kommunalwahlen an</a>. Rund um Wahlen verbreiten sich Falschmeldungen, manipulierte Inhalte und irreführende Behauptungen besonders schnell und weit über die Wahlkreise hinaus. Unsere Antwort darauf: <strong>Flood the zone with trust!</strong> Vom 1. bis 20. September wird unsere Trust-Checking-Plattform zum Spielfeld gegen Desinformation.</p>",
        "imageSrc": "/images/community_challenge/collage_prices_vertical.png",
        "imageAlt": "Collage der Gewinne der Streak-Challenge",
        "sections": [
          {
            "heading": "Wie funktioniert die Streak-Challenge?",
            "bodyHtml": "<p>Gemeinsam prüfen wir Nachrichten auf ihre Vertrauenswürdigkeit (Trust-Checks) und machen unsere Ergebnisse sichtbar für andere (Trust-Shares) – online, im persönlichen Umfeld und überall dort, wo Falschinformationen ihre Wellen schlagen! Unsere Community-Ziele lauten: 1) Daily Streak am Leben halten, also jeden Tag mindestens 1 gemeinsam gelöster Fall (z. B. ein Online-Artikel). 2) Trust-Barometer füllen und 100 Fälle erreichen. 3) So viele Trust-Shares wie möglich!</p>"
          },
          {
            "heading": "Wie kann ich mitmachen?",
            "bodyHtml": "<p>Werde co:detective! Erstelle ein Userkonto und sammle vom 1. bis 20. September deine Trust-Checks. Für alle Teilnehmenden gibt es die Chance auf vertrauenswürdige Geschenke. Jeder Check zählt - egal, ob du einmal mitmachst oder die ganzen 20 Tage im September dran bleibst. <a href=\"/#challenge-information\">Mehr Infos zu den Gewinnen und Teilnahmebedingungen gibt’s hier!</a></p>"
          },
          {
            "heading": "Warum mitmachen?",
            "bodyHtml": "<p>Mit jedem Trust-Check trainierst du deinen Blick für Quellen, Belege und Manipulationstechniken. Außerdem hilfst du anderen bei der Einordnung und bringst die Community-Ziele voran. Seit Mai ist diese Version unserer Trust-Checking-Plattform neu gelauncht. Mit der Challenge sammeln wir weitere Erfahrungen für die Weiterentwicklung und dein Feedback ist dabei goldwert!</p>"
          },
          {
            "heading": "Trust-Check? co:detective? Was?",
            "bodyHtml": "<p>Für dich ist hier wahrscheinlich fast alles neu - keine Sorge, vieles wird im Laufe der Plattformnutzung ersichtlich. <a href=\"/#challenge-information\">Hier werden aber die wichtigsten Begriffe erklärt.</a></p>"
          }
        ]
      },
      "leaderboardLimit": 5,
      "leaderboardReviewCaps": {
        "gormlabenz": 5
      }
    }
  $json$::jsonb,
  $json$
    [
      {
        "contentHtml": "<p>Die Challenge ist live: Löst gemeinsam 100 Fälle bis zum 20. September und schaut täglich rein, welche Ziele die Community erreicht.</p>",
        "visibleFrom": "2026-09-01T00:00:00+02:00",
        "visibleUntil": "2026-09-20T23:59:59.999+02:00"
      }
    ]
  $json$::jsonb
)
on conflict (id) do update
set
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  visible_from = excluded.visible_from,
  visible_until = excluded.visible_until,
  content = excluded.content,
  messages = excluded.messages,
  updated_at = now();
