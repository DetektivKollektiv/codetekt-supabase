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
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- <- Gorm
    'https://www.mdr.de/nachrichten/welt/osteuropa/politik/ukraine-krieg-tschechien-botschafter-eklat-rusische-propaganda100.html',
    'url',
    1,
    now() - interval '2 days'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- <- Anna
    'Die aktuellen Entwicklungen in der Klimapolitik zeigen...',
    'text',
    1,
    now() - interval '1 day'
  );