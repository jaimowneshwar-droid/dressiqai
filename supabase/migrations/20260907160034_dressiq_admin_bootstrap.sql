/*
# First-admin bootstrap function

## Overview
Provides a one-time, secure way to create the very first admin account.
Only works when the `admins` table is completely empty — once any admin
exists, this function refuses to run. This prevents customers from ever
using it to gain admin access.

## How it works
1. The function checks if admins table is empty.
2. If empty, it creates a new auth user with the supplied email + password
   and immediately inserts them into the `admins` table.
3. If not empty, it raises an error.
4. The function is SECURITY DEFINER (runs as owner, bypasses RLS) and
   callable by anon (needed since the first admin has no session yet).

## Security
- The self-disable check (admins table must be empty) is inside the function
  body, not in a policy — it cannot be bypassed by the caller.
- Password is hashed by Supabase Auth internally.
- After the first admin is created, this function is permanently inert.
*/

CREATE OR REPLACE FUNCTION bootstrap_first_admin(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_admin_count int;
  v_user_id uuid;
BEGIN
  SELECT count(*) INTO v_admin_count FROM admins;

  IF v_admin_count > 0 THEN
    RAISE EXCEPTION 'Admin accounts already exist. Contact an existing admin to add you.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb
  )
  RETURNING id INTO v_user_id;

  -- Insert into admins table
  INSERT INTO admins (user_id, email) VALUES (v_user_id, p_email);

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION bootstrap_first_admin FROM authenticated;
GRANT EXECUTE ON FUNCTION bootstrap_first_admin TO anon, authenticated;
