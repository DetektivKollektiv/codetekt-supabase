-- ============================================
-- SEED: Test Users + Sample Data
-- Nur für lokale Entwicklung
-- Mit festen UUIDs für referenzierbare Test-Daten
-- ============================================

-- Test User 1: gorm-labenz@hotmail.com / testpassword123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'gorm-labenz@hotmail.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"gorm-labenz@hotmail.com"}'::jsonb,
  'email',
  gen_random_uuid(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

-- Profile wurde via Trigger erstellt, jetzt updaten
UPDATE public.profiles
SET
  username = 'gormlabenz',
  is_admin = true, -- Erster User ist Admin
  updated_at = current_timestamp
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ============================================
-- Test User 2: anna.schmidt@example.com / testpassword123
-- ============================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'authenticated',
  'authenticated',
  'anna.schmidt@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"anna.schmidt@example.com"}'::jsonb,
  'email',
  gen_random_uuid(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'annaschmidt',
  updated_at = current_timestamp
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================
-- Test User 3: max.mueller@example.com / testpassword123
-- ============================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'authenticated',
  'authenticated',
  'max.mueller@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"max.mueller@example.com"}'::jsonb,
  'email',
  gen_random_uuid(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'maxmueller',
  updated_at = current_timestamp
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ============================================
-- Test User 4: lisa.weber@example.com / testpassword123
-- ============================================

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'authenticated',
  'authenticated',
  'lisa.weber@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","email":"lisa.weber@example.com"}'::jsonb,
  'email',
  gen_random_uuid(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'lisaweber',
  updated_at = current_timestamp
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';