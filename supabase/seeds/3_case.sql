-- seed.sql
-- Optional: reset table for local dev
-- TRUNCATE TABLE public.cases RESTART IDENTITY CASCADE;

INSERT INTO public.cases (
  id,
  submitted_by,
  content,
  content_type,
  template_version,
  submitted_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.mdr.de/nachrichten/welt/osteuropa/politik/ukraine-krieg-tschechien-botschafter-eklat-rusische-propaganda100.html',
    'url',
    1,
    now() - interval '2 days'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Die aktuellen Entwicklungen in der Klimapolitik zeigen...',
    'text',
    1,
    now() - interval '1 days'
  ),
  (
    '0de6a28d-db36-4c73-9131-e8ccbce69557',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.reuters.com/business/environment/western-europe-braces-another-wave-snow-ice-2026-01-07/',
    'url',
    1,
    now() - interval '38 days'
  ),
  (
    'f2974bce-eeca-41d0-99d2-8c73ed966dcf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.reuters.com/business/environment/dutch-train-traffic-halted-due-snow-ice-2026-01-06/',
    'url',
    1,
    now() - interval '33 days'
  ),
  (
    '9c2b5f2f-7701-4d79-ac44-458dba098775',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.reuters.com/business/bulgaria-celebrates-entry-into-euro-zone-lev-currency-banished-into-history-2026-01-01/',
    'url',
    1,
    now() - interval '8 days'
  ),
  (
    '136453c2-cc8d-4e5e-95ed-8f0e3a113c2c',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.reuters.com/world/europe/world-reacts-fatal-fire-swiss-ski-resort-bar-2026-01-01/',
    'url',
    1,
    now() - interval '41 days'
  ),
  (
    'd3c3f904-470b-4fdc-b978-df66ac90043a',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.reuters.com/world/europe/only-greenland-denmark-can-decide-their-future-european-leaders-say-joint-2026-01-06/',
    'url',
    1,
    now() - interval '25 days'
  ),
  (
    'e5b79cf0-c86f-4d69-a63b-41d9ac8b8df0',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.reuters.com/world/europe/france-working-with-allies-plan-should-us-move-greenland-2026-01-07/',
    'url',
    1,
    now() - interval '43 days'
  ),
  (
    'a2f0d821-9807-4f95-bc1b-1a5c9a6d7c3f',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.reuters.com/markets/europe/rebuilding-ukraine-could-be-top-european-investment-theme-2026-2026-01-07/',
    'url',
    1,
    now() - interval '19 days'
  ),
  (
    'e3c31d30-9d3f-4b3a-a7f6-3f9c02d78b7e',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.reuters.com/business/eu-summons-farm-ministers-secure-mercosur-deal-backing-2026-01-06/',
    'url',
    1,
    now() - interval '12 days'
  ),
  (
    '5f26dbb6-5d42-4a79-8c27-0e2997f1d701',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.reuters.com/world/americas/european-stocks-pause-rally-traders-assess-venezuela-fallout-ahead-data-2026-01-07/',
    'url',
    1,
    now() - interval '29 days'
  ),
  (
    'c07bbd9d-08e6-48a5-8f83-9b86d12c8aaf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://amp.dw.com/en/venezuela-germany-hesitates-to-condemn-us-attack/a-75399144',
    'url',
    1,
    now() - interval '17 days'
  ),
  (
    '6b6f0f45-ef48-4f50-931f-46ad0cd3c3b5',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.theguardian.com/world/2026/jan/06/uk-france-ready-to-deploy-troops-to-ukraine-after-ceasefire',
    'url',
    1,
    now() - interval '37 days'
  ),
  (
    'd1a7f8c0-36f2-4e5f-b2a6-7a38f62bf2d0',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.theguardian.com/world/2026/jan/06/deaths-snow-ice-freezing-temperatures-havoc-europe',
    'url',
    1,
    now() - interval '16 days'
  ),
  (
    '30a19586-6cd1-4eb7-9f49-4b1b4a8d733e',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.theguardian.com/us-news/2026/jan/05/a-warning-not-an-insult-us-doubles-down-on-attack-on-europe',
    'url',
    1,
    now() - interval '23 days'
  ),
  (
    'c8c0f221-5c91-4c2f-820b-66b7d84bb7d2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://apnews.com/article/715dbe412cffa68f87f21045bc74c85b',
    'url',
    1,
    now() - interval '11 days'
  ),
  (
    '0f4a4cc2-7c5e-40ef-9b8b-cf1cbb7c6f0d',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://apnews.com/article/trump-european-union-greenland-denmark-c5995b27ac8aee84d0064991c86d633e',
    'url',
    1,
    now() - interval '40 days'
  ),
  (
    'b87f0a23-e57c-4cdd-a5f4-9f07cf8f27a7',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://apnews.com/article/peace-proposals-diplomacy-ukraine-war-8eaa7d78332ab3664c54e34b0d3df020',
    'url',
    1,
    now() - interval '6 days'
  ),
  (
    'ac58db0b-3e14-4ac5-8a95-2c7c2a6e2b61',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://apnews.com/article/europe-summit-ukraine-funds-assets-russia-loan-abc7b025112dba1f074755e454c29681',
    'url',
    1,
    now() - interval '21 days'
  ),
  (
    '1dd96e78-409e-4e31-b3e7-bd1f9a58b9c0',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://apnews.com/article/europe-russia-frozen-assets-ukraine-reparations-loan-0c0537fbc4a1fb9da852a9bdd73998a9',
    'url',
    1,
    now() - interval '35 days'
  ),
  (
    '3a7c2a67-0f41-4c17-a5f8-2e6b4ad0a9d7',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.aljazeera.com/news/2026/1/7/us-says-military-always-an-option-in-greenland-as-europe-rejects-threats',
    'url',
    1,
    now() - interval '44 days'
  ),
  (
    'b0f25b7f-9d1c-4a3a-a9fb-c0b2ce26d6a2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.aljazeera.com/news/2026/1/6/ukraine-talks-in-paris-yield-significant-progress-on-security-pledges',
    'url',
    1,
    now() - interval '18 days'
  ),
  (
    'a0eb1f65-19a0-4d59-a257-42f5b6dfb7d9',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.aljazeera.com/news/2025/12/30/which-countries-will-start-using-the-euro-in-2026',
    'url',
    1,
    now() - interval '14 days'
  ),
  (
    '9f4b66d3-70f3-4d8c-9d35-3f3b64e3c46b',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.euronews.com/2026/01/06/at-least-six-dead-as-cold-snap-grips-europe-with-snow-and-ice-wreaking-travel-havoc',
    'url',
    1,
    now() - interval '26 days'
  ),
  (
    '20de5ef2-6a7e-4d5c-9a40-6d9c0f5c3b7e',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.euronews.com/2026/01/06/coalition-of-the-willing-meets-in-paris-to-discuss-security-guarantees-for-ukraine',
    'url',
    1,
    now() - interval '9 days'
  ),
  (
    '8fdc2f35-7c23-4f95-a5a1-6eae2b3b0a3a',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.euronews.com/2026/01/05/europe-must-stop-pretending-there-was-ever-a-truly-rules-based-international-order',
    'url',
    1,
    now() - interval '13 days'
  ),
  (
    '77f7ddfa-6b8e-4e94-93b7-9e78c40b0f6f',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.zeit.de/politik/2026-01/groenland-daenemark-eu-trump-usa',
    'url',
    1,
    now() - interval '28 days'
  ),
  (
    '40a7240b-6b36-4f57-8f87-febfa74ed6fa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.zeit.de/politik/2026-01/usa-donald-trump-venezuela-praesident-oel-einnahmen-zugriff-gxe',
    'url',
    1,
    now() - interval '3 days'
  ),
  (
    'd51a2d91-60d3-4053-a9d2-1d0b2d0c0f13',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.zeit.de/politik/2026-01/donald-trump-groenland-venezuela-nicolas-maduro-usa-politikpodcast',
    'url',
    1,
    now() - interval '24 days'
  ),
  (
    'f4d2d0b6-b7aa-48c4-9c05-9f055c4edb45',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.zeit.de/politik/deutschland/2026-01/friedrich-merz-appell-koalition-wirtschaft-deutschland-verbesserung',
    'url',
    1,
    now() - interval '27 days'
  ),
  (
    '0a3c6f1a-9360-4a27-8bf2-58b5b4f4983f',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://www.sueddeutsche.de/politik/ukraine-sicherheitsgarantien-europa-macron-merz-trump-putin-li.3363693',
    'url',
    1,
    now() - interval '10 days'
  ),
  (
    '6f5b1a6d-3e9c-4a4a-9c32-7d7df3c0a8a6',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://www.sueddeutsche.de/politik/sicherheitsgarantien-fuer-ukraine-usa-und-groenland-comeback-versuch-der-fdp-li.3364105',
    'url',
    1,
    now() - interval '15 days'
  ),
  (
    'c3a9ef3c-3c4a-4ff2-b5a3-f7d31a8bb2b0',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'WhatsApp-Weiterleitung: ''Ab nächster Woche wird Bargeld in der EU verboten – hebt sofort alles ab!'' Quelle wird nicht genannt.',
    'text',
    1,
    now() - interval '20 days'
  ),
  (
    '8d1a4a35-8b7c-44c1-8f1a-1a4d1e8d3b5e',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Telegram-Post behauptet, ein ''geheimes WHO-Papier'' plane eine weltweite Ausgangssperre ab Februar. Kein Link, nur Screenshot ohne Datum.',
    'text',
    1,
    now() - interval '42 days'
  ),
  (
    '2b0c9d51-4a1f-4c2e-9a4f-5e2b1e7c0a9f',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Instagram-Reel: ''Windräder verursachen mehr CO2 als Kohlekraftwerke'' – wird mit einer unscharfen Grafik ''Studie'' belegt.',
    'text',
    1,
    now() - interval '31 days'
  ),
  (
    'bd1f0b74-1c77-4e1b-9a1f-0b7c1a1d2e3f',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'X/Twitter-Thread: ''Die Wahl wurde durch eine neue Software manipuliert'' – viele Ausrufezeichen, keine überprüfbaren Belege.',
    'text',
    1,
    now() - interval '7 days'
  ),
  (
    '7c0b1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Mail-Kettenbrief: ''Die Regierung hat Impfungen heimlich verpflichtend gemacht'' – verweist auf ''Artikel 12'' ohne Zitat oder Link.',
    'text',
    1,
    now() - interval '22 days'
  ),
  (
    '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Facebook-Post: ''In Deutschland gibt es jetzt ein Verbot von Heizungen unter 10 Jahren'' – angeblich ab sofort, aber ohne Quelle.',
    'text',
    1,
    now() - interval '34 days'
  ),
  (
    '4d3c2b1a-0f9e-8d7c-6b5a-4f3e2d1c0b9a',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Screenshot einer angeblichen Tagesschau-Eilmeldung zu ''Grenzschließung ab morgen'' – typisches Fake-Design, keine URL.',
    'text',
    1,
    now() - interval '12 days'
  ),
  (
    '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'WhatsApp: ''Ein neues Gesetz erlaubt der Polizei, jederzeit dein Handy zu durchsuchen'' – mit ''steht im Bundesgesetzblatt'', aber ohne Nummer.',
    'text',
    1,
    now() - interval '29 days'
  ),
  (
    '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Blog-Kommentar: ''Die EU will allen Bürgern Mikrochips implantieren'' – Quellenangabe: ''ein Insider''.',
    'text',
    1,
    now() - interval '18 days'
  ),
  (
    'abc12345-6789-4abc-8def-0123456789ab',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sprachnachricht-Zusammenfassung: ''Ein Arzt hat gesagt, dass Leitungswasser jetzt gefährlich ist'' – keine Namen, keine Daten.',
    'text',
    1,
    now() - interval '41 days'
  ),
  (
    'def67890-1234-4def-8abc-0123456789de',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Behauptung: ''Supermarkt X mischt Insektenmehl heimlich in alle Brote'' – als Foto eines Etiketts, das abgeschnitten ist.',
    'text',
    1,
    now() - interval '5 days'
  ),
  (
    '01234567-89ab-4012-8cde-0123456789ff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Kettenbrief: ''Ab 2026 wird das Deutschlandticket abgeschafft und durch ein 99€-Ticket ersetzt'' – ohne Link, nur Behauptung.',
    'text',
    1,
    now() - interval '14 days'
  ),
  (
    '89abcdef-0123-489a-8bcd-ef0123456789',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'SMS: ''Dein Konto wird wegen neuer EU-Regeln gesperrt – bestätige hier'' + Phishing-Link (gekürzt).',
    'text',
    1,
    now() - interval '27 days'
  ),
  (
    '76543210-fedc-4765-8ba9-0123456789aa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Forum-Post: ''Die NASA hat die Sonne für 3 Tage abgeschaltet'' – offensichtlich sensationell, keine seriösen Quellen.',
    'text',
    1,
    now() - interval '36 days'
  ),
  (
    '13572468-2468-4135-8ace-135724682468',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Behauptung: ''Ein neuer Vertrag erlaubt der EU, private Immobilien zu enteignen'' – bezieht sich auf ''Artikel 17'', aber ohne Kontext.',
    'text',
    1,
    now() - interval '9 days'
  ),
  (
    '24681357-1357-4246-8bdf-246813571357',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'WhatsApp: ''In Berlin gibt es eine Ausgangssperre wegen Schneechaos'' – mit falschem Wappen im Bild.',
    'text',
    1,
    now() - interval '23 days'
  ),
  (
    'fedcba98-7654-4fed-8cba-9876543210fe',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'X-Post: ''Bulgaria has left the EU overnight'' – widerspricht anderen Meldungen, keine Quelle.',
    'text',
    1,
    now() - interval '15 days'
  ),
  (
    'c0ffee00-babe-4c0f-8eed-deadbeef0001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Telegram: ''Die Bahn stellt den gesamten Betrieb ab nächster Woche dauerhaft ein'' – wird mit altem Foto von 2013 gepostet.',
    'text',
    1,
    now() - interval '33 days'
  ),
  (
    'c0ffee00-babe-4c0f-8eed-deadbeef0002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Kommentar: ''Ein Video zeigt eindeutig, dass die Aufnahmen gefälscht sind'' – Video fehlt, nur Text.',
    'text',
    1,
    now() - interval '11 days'
  );