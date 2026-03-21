-- ================================================
-- CREATE ADMIN USER FOR CHMETRICS ADMIN
-- Run this in Supabase SQL Editor
-- ================================================

-- Create the user with email and password
CREATE AUTH IDENTITIES DISABLED;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'osman.aydin0809@gmx.at',
  crypt('S!pse2402', gen_random_cryptSalt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create profile with admin role
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  tier,
  streak,
  created_at,
  updated_at
)
SELECT
  id,
  'osman.aydin0809@gmx.at',
  'Osman Aydin',
  'admin',
  'professional',
  0,
  now(),
  now()
FROM auth.users
WHERE email = 'osman.aydin0809@gmx.at';
