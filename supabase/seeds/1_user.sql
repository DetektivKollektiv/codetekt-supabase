-- ============================================
-- SEED: Test Users + Sample Data
-- Nur für lokale Entwicklung
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
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'gorm-labenz@hotmail.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Gorm Labenz"}',
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
  uuid_generate_v4(),
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  format(
    '{"sub":"%s","email":"%s"}',
    (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com')::text,
    'gorm-labenz@hotmail.com'
  )::jsonb,
  'email',
  uuid_generate_v4(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'gormlabenz',
  full_name = 'Gorm Labenz',
  updated_at = current_timestamp
WHERE id = (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com');

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
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'anna.schmidt@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Anna Schmidt"}',
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
  uuid_generate_v4(),
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  format(
    '{"sub":"%s","email":"%s"}',
    (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com')::text,
    'anna.schmidt@example.com'
  )::jsonb,
  'email',
  uuid_generate_v4(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'annaschmidt',
  full_name = 'Anna Schmidt',
  updated_at = current_timestamp
WHERE id = (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com');

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
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'max.mueller@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Max Müller"}',
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
  uuid_generate_v4(),
  (SELECT id FROM auth.users WHERE email = 'max.mueller@example.com'),
  format(
    '{"sub":"%s","email":"%s"}',
    (SELECT id FROM auth.users WHERE email = 'max.mueller@example.com')::text,
    'max.mueller@example.com'
  )::jsonb,
  'email',
  uuid_generate_v4(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'maxmueller',
  full_name = 'Max Müller',
  updated_at = current_timestamp
WHERE id = (SELECT id FROM auth.users WHERE email = 'max.mueller@example.com');

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
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'lisa.weber@example.com',
  crypt('testpassword123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Lisa Weber"}',
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
  uuid_generate_v4(),
  (SELECT id FROM auth.users WHERE email = 'lisa.weber@example.com'),
  format(
    '{"sub":"%s","email":"%s"}',
    (SELECT id FROM auth.users WHERE email = 'lisa.weber@example.com')::text,
    'lisa.weber@example.com'
  )::jsonb,
  'email',
  uuid_generate_v4(),
  current_timestamp,
  current_timestamp,
  current_timestamp
);

UPDATE public.profiles
SET
  username = 'lisaweber',
  full_name = 'Lisa Weber',
  updated_at = current_timestamp
WHERE id = (SELECT id FROM auth.users WHERE email = 'lisa.weber@example.com');