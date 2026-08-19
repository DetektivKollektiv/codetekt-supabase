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
      "intro": {
        "title": "Willkommen zur Streak-Challenge",
        "eyebrow": "Aktion zu den Landtagswahlen 2026",
        "imageAlt": "Collage der Gewinne der Streak-Challenge",
        "imageSrc": "/images/community_challenge/collage_prices_vertical.png",
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
        ],
        "descriptionHtml": "<p><a href=\"https://www.bundeswahlleiterin.de/service/wahltermine.html\" target=\"_blank\" rel=\"noopener noreferrer\">Im September 2026 stehen mehrere Landtags- und Kommunalwahlen an</a>. Rund um Wahlen verbreiten sich Falschmeldungen, manipulierte Inhalte und irreführende Behauptungen besonders schnell und weit über die Wahlkreise hinaus. Unsere Antwort darauf: <strong>Flood the zone with trust!</strong> Vom 1. bis 20. September wird unsere Trust-Checking-Plattform zum Spielfeld gegen Desinformation.</p>"
      },
      "title": "Trust Barometer",
      "eyebrow": "Community Challenge",
      "dailyGoals": [1, 3, 5],
      "milestones": [
        { "value": 0 },
        { "value": 50 },
        {
          "label": "Mehr Gewinne",
          "value": 75,
          "tooltip": "Bei 75 gibt es erste Gewinne. Erfahre <a href=\"/#challenge-information\">hier</a> mehr."
        },
        { "value": 100 }
      ],
      "information": {
        "title": "Wie und warum mitmachen?",
        "buttonLabel": "Anleitung und Gewinne",
        "contentHtml": "<section><h4>Unsere 3 Ziele als codetekt-Community</h4><ol><li><strong>Streak-Flamme täglich am Brennen halten:</strong> 20 Tage lang soll jeden Tag mindestens ein Fall gemeinsam von der Community gelöst werden. Damit ein Fall als gelöst gilt, braucht es mindestens zwei co:detectives, die diesen Fall prüfen und damit einen sogenannten „Trust-Check“ machen. Schaffen wir jeden Tag mindestens einen gelösten Fall, bleibt unsere Streak-Flamme 20 Tage lang an.</li><li><strong>100 Fälle in 20 Tagen:</strong> Gemeinsam wollen wir 100 gelöste Fälle knacken – im Schnitt fünf pro Tag. Ambitioniert, aber machbar! Und sobald wir 75 Fälle erreicht haben, schalten wir 5 Extra-Gewinne frei.</li><li><strong>Trust-Shares sammeln:</strong> Wir machen unsere Bewertungen sichtbar. Mit jedem Trust-Share bringst du geprüfte Informationen genau dorthin, wo Menschen Orientierung brauchen.</li></ol></section><section><h4>Kurz erklärt: Trust-Check? Fall? co:detective? Was?</h4><p>Im Kontext dieser Challenge fallen viele neue Begrifflichkeiten. Für dich ist hier wahrscheinlich fast alles neu – keine Sorge, vieles klärt sich dann im Laufe der Plattformnutzung. Hier werden die wichtigsten Begriffe erklärt:</p><p><strong>Trust-Checking-Plattform:</strong> Die <a href=\"https://platform.codetekt.org/\" target=\"_blank\" rel=\"noopener noreferrer\">Plattform</a> ist das digitale Herzstück von codetekt: Hier schärfst du deinen Blick für Falschinformationen, trainierst Nachrichtenkompetenz und prüfst die Vertrauenswürdigkeit von Informationen anhand der <a href=\"https://codetekt.org/trust-checking/\" target=\"_blank\" rel=\"noopener noreferrer\">5 Trust-Checking-Kriterien</a>.</p><p><strong>co:detective</strong> (co = Community; detective = Detektiv*in): Als co:detective bist du der Desinformation auf der Spur. Du prüfst Fälle Schritt für Schritt auf der Trust-Checking-Plattform.</p><p><strong>Fall:</strong> Ein Fall ist eine eingereichte Information, zum Beispiel ein Online-Artikel oder eine Textnachricht. Gelöst ist ein Fall, wenn ihn mindestens zwei co:detectives geprüft haben.</p><p><strong>Trust-Check:</strong> Prüft eine Person einen Fall auf Vertrauenswürdigkeit, dann macht sie einen Trust-Check. Mit einem Trust-Check stärkst du deine Nachrichtenkompetenz. Das Ergebnis hilft auch anderen, Informationen besser einzuordnen.</p><p><strong>Trust-Spreader (Person):</strong> Als Trust-Spreader teilst du gelöste Fälle dort, wo sie anderen helfen: auf Social Media, Nachrichtenseiten oder in Chats.</p><p><strong>Trust-Share (geteiltes Ergebnis):</strong> Ein Trust-Share entsteht, wenn du einen gelösten Fall online teilst. Um den Share im Zähler zu erfassen, brauchen wir einen Link oder Screenshot deines Shares auf unserem <a href=\"https://discord.com/invite/fFABTPSxXA\" target=\"_blank\" rel=\"noopener noreferrer\">Discord-Server</a> im Channel „Streak-Challenge“.</p></section><section><h4>Wer gewinnt bei der Streak-Challenge?</h4><p>Bei der Challenge zählt jeder Beitrag: checken, teilen, dranbleiben. Und natürlich warten auch vertrauenswürdige Geschenke auf dich. Teilnehmer*in ist automatisch jeder Account, der zwischen dem 1. und 20. September Trust-Checks auf der Plattform macht – es braucht keine gesonderte Anmeldung für die Challenge.</p><p><strong>Klettere in die Top-3 des Leaderboards:</strong> Die drei co:detectives mit den meisten abgeschlossenen Trust-Checks landen ganz oben im Leaderboard und gewinnen.</p><p><strong>Mach Trust sichtbar und lande im Lostopf:</strong> Du machst Trust sichtbar? Unter allen, die mindestens drei gelöste Fälle im Internet geteilt haben, verlosen wir drei weitere Gewinne. Dabei zählen wir die nachgewiesenen Trust-Shares auf unserem <a href=\"https://discord.com/invite/fFABTPSxXA\" target=\"_blank\" rel=\"noopener noreferrer\">Discord-Server</a> im Channel „Streak-Challenge“. Auf Discord tauschen wir uns als codetekt-Community aus, dort gibt’s auch mehr Infos zu Mitmach-Möglichkeiten und Events. <a href=\"https://discord.com/invite/fFABTPSxXA\" target=\"_blank\" rel=\"noopener noreferrer\">Hier geht’s zu unserem Server!</a></p><p><strong>Community-Bonus bei 75 gelösten Fällen:</strong> Wenn wir kooperativ als Community 75 Fälle lösen, schalten wir fünf zusätzliche Lostopf-Gewinne frei. So gibt’s Chancen auf Gewinne, auch wenn du später einsteigst: Mit mindestens fünf abgeschlossenen Trust-Checks bist du im Lostopf dabei.</p></section><section><h4>Gewinne</h4><img src=\"/images/community_challenge/260806_collage-gewinne-quer-groß.png\" alt=\"Collage mit den Gewinnen der Streak-Challenge: Pullover, T-Shirt, Jutebeutel, Tasse, Sticker und Kompreno-Abo\" width=\"2000\" height=\"857\"><p><strong>Top 3 co:detectives im Leaderboard</strong></p><p>Die Top 3 wählen ihre Gewinne der Reihe nach aus: Platz 1 wählt zuerst einen der drei Gewinne, danach Platz 2 und anschließend Platz 3.</p><ul><li><strong><a href=\"https://codetekt-shop.myspreadshop.de/logo+weiss-A68de6a76a87f551fafd95e96?productType=1187&amp;sellable=qNw03JzrX9tDxoAXx4wN-1187-26&amp;appearance=938\" target=\"_blank\" rel=\"noopener noreferrer\">codetekt-Pulli</a> + Merch-Paket*</strong><br>Mit dem warmen codetekt-Pulli sicherst du dir dein neues Lieblingsaccessoire für den Herbst.</li><li><strong><a href=\"https://kompreno.eu/de/startseite-deutsch/\" target=\"_blank\" rel=\"noopener noreferrer\">Kompreno 3-Monats-Abo</a> + Merch-Paket*</strong><br>Kompreno macht Weltjournalismus auf Deutsch! Jeden Tag wählen Redakteur*innen eine Handvoll lesenswerter Beiträge aus – Journalismus, der über Wochen relevant bleibt, statt Schlagzeilen, die bis zum Mittagessen veraltet sind.</li><li><strong>codetekt Werwolf-Spiel + Merch-Paket*</strong><br>Bei unserem Spiel trifft Werwolf auf Trust-Check: Im Dorf treiben Desinformant*innen ihr Unwesen. Doch Bürger*innen, Journalist*innen, Trust-Checker, Whistleblower und weitere schließen sich zusammen und sorgen spielerisch für mehr Vertrauen in der Gesellschaft.</li></ul><p><em>*Das Merch-Paket besteht aus einem bedruckten Jutebeutel, einem Sticker-Set und 3 Postkarten.</em></p><p><strong>3 Lostopf-Gewinne für Trust-Spreader</strong></p><p>Unsere Detektiv-Arbeit soll sichtbar werden. Auch unter den Trust-Spreadern, die mindestens 3 Fälle öffentlich geteilt haben, verlosen wir:</p><ul><li>codetekt T-Shirt + Sticker-Set + 3 Postkarten</li><li>codetekt Jutebeutel + Sticker-Set + 3 Postkarten</li><li>codetekt Tasse + Sticker-Set + 3 Postkarten</li></ul><p><strong>75 gelöste Fälle = 5 zusätzliche Lostopf-Gewinne</strong></p><p>Alle sollen eine Chance auf einen Gewinn haben. Auch wenn du später als co:detective einsteigst und insgesamt mindestens 5 Trust-Checks gemacht hast, gelangst du in den Lostopf für 5 weitere Gewinne. Aber: Um diese 5 Lose freizuschalten, muss die Community insgesamt mindestens 75 Fälle gecheckt haben. Verlost werden auch hier:</p><ul><li>codetekt T-Shirt + Sticker-Set + 3 Postkarten</li><li>codetekt Jutebeutel + Sticker-Set + 3 Postkarten</li><li>codetekt Tasse + Sticker-Set + 3 Postkarten</li></ul></section>",
        "descriptionHtml": "<p>Mit jedem Trust-Check bringst du nicht nur die Community-Ziele voran. Du trainierst deinen Blick für Quellen, Belege und Manipulationstechniken. Außerdem hilfst du anderen bei der Einordnung von Nachrichten. Mit der Challenge sammeln wir außerdem Erfahrungen für die Weiterentwicklung der Plattform und dein Feedback ist dabei goldwert!</p>"
      },
      "totalTarget": 100,
      "trustShares": {
        "count": 0,
        "title": "Trust-Shares",
        "description": "So viele Fälle wurden bereits von der Community geteilt"
      },
      "leaderboardLimit": 5,
      "leaderboardReviewCap": 5,
      "descriptionColumnsHtml": [
        "<p>Gemeinsam prüfen wir Nachrichten auf ihre Vertrauenswürdigkeit (Trust-Checks) und machen unsere Ergebnisse sichtbar für andere (Trust-Shares) – online, im persönlichen Umfeld und überall dort, wo Falschinformationen ihre Wellen schlagen!</p>",
        "<p>Unsere Community-Ziele lauten: 1) Daily Streak am Leben halten, also jeden Tag mindestens 1 gemeinsam gelöster Fall (z. B. ein Online-Artikel). 2) Trust-Barometer füllen und 100 Fälle erreichen. 3) So viele Trust-Shares wie möglich! Infos zur Anleitung und den Gewinnen gibt’s <a href=\"#challenge-information\">hier</a>.</p>"
      ],
      "leaderboardReviewCapUsernames": ["gormlabenz"]
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
