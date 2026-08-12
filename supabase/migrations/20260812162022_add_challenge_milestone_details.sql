update public.challenge_configs
set
  content = jsonb_set(
    content,
    '{milestones}',
    $json$
      [
        { "value": 0 },
        { "value": 50 },
        {
          "value": 75,
          "label": "Gewinne",
          "tooltip": "Bei 75 gibt es erste Gewinne. Erfahre <a href=\"/#challenge-information\">hier</a> mehr."
        },
        { "value": 100 }
      ]
    $json$::jsonb
  ),
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
