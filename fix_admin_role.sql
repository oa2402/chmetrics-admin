-- ================================================
-- SET ADMIN ROLE FOR EXISTING USER
-- User ID: a0113fc3-058f-4b62-8509-7e0a897854fc
-- Email: osman.aydin0809@gmx.at
-- ================================================

-- 1. Update auth.users raw_user_meta_data to include role: admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE id = 'a0113fc3-058f-4b62-8509-7e0a897854fc';

-- 2. Check if profile exists
SELECT * FROM public.profiles WHERE id = 'a0113fc3-058f-4b62-8509-7e0a897854fc';

-- 3. If no profile exists, create one
INSERT INTO public.profiles (id, email, full_name, role, tier, created_at, updated_at)
VALUES ('a0113fc3-058f-4b62-8509-7e0a897854fc', 'osman.aydin0809@gmx.at', 'Osman Aydin', 'admin', 'professional', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();
