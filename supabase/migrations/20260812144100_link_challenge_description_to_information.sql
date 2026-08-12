update public.challenge_configs
set
  content = jsonb_set(
    content,
    '{descriptionColumnsHtml,1}',
    to_jsonb(
      replace(
        content #>> '{descriptionColumnsHtml,1}',
        'href="/streak_challenge_2026_teilnahmebedingungen"',
        'href="#challenge-information"'
      )
    ),
    false
  ),
  updated_at = now()
where
  id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef'
  and content #>> '{descriptionColumnsHtml,1}' like
    '%href="/streak_challenge_2026_teilnahmebedingungen"%';
