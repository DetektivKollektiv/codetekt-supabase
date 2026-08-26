update public.challenge_configs
set
  content = jsonb_set(
    content,
    '{information,contentHtml}',
    to_jsonb(
      replace(
        replace(
          content #>> '{information,contentHtml}',
          'Menschen Orientierung brauchen.</li></ol></section><section><h4>Kurz erklärt',
          'Menschen Orientierung brauchen.</li></ol><p>Alle Infos zu den <a href="/streak_challenge_2026_teilnahmebedingungen">Teilnahmebedingungen</a> findest du hier!</p></section><section><h4>Kurz erklärt'
        ),
        'es braucht keine gesonderte Anmeldung für die Challenge.</p><p><strong>Klettere',
        'es braucht keine gesonderte Anmeldung für die Challenge. Weitere Details findest du außerdem in den <a href="/streak_challenge_2026_teilnahmebedingungen">Teilnahmebedingungen</a>.</p><p><strong>Klettere'
      )
    ),
    false
  ),
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
