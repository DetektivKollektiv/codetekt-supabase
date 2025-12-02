-- ============================================
-- SEED: Test Users + Sample Data
-- Nur für lokale Entwicklung
-- ============================================

-- Test User: gorm-labenz@hotmail.com / testpassword123
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

-- Identity für Email-Login
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

-- Profile aktualisieren (wird durch Trigger angelegt)
UPDATE public.profiles
SET
  username = 'gormlabenz',
  full_name = 'Gorm Labenz',
  updated_at = current_timestamp
WHERE id = (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com');

