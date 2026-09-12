/*
# Add admin user function

## Overview
Allows an existing admin to create a new admin auth user and add them to
the admins table. This is a SECURITY DEFINER function that:
1. Verifies the CALLER is an existing admin (via auth.uid() check)
2. Creates a new auth user with the supplied email + password
3. Inserts the new user into the admins table

## Security
- The caller check uses auth.uid() — cannot be forged
- SET search_path prevents search path manipulation
- Only callable by authenticated (anon is revoked)
- Password is hashed with bcrypt via crypt()
*/

CREATE OR REPLACE FUNCTION add_admin_user(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized. Only existing admins can add new admins.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Check if already an admin
    IF EXISTS (SELECT 1 FROM admins WHERE user_id = v_user_id) THEN
      RAISE EXCEPTION 'This user is already an admin.';
    END IF;
    -- Add existing user as admin
    INSERT INTO admins (user_id, email) VALUES (v_user_id, p_email);
  ELSE
    -- Create new auth user
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

    INSERT INTO admins (user_id, email) VALUES (v_user_id, p_email);
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION add_admin_user FROM anon;
GRANT EXECUTE ON FUNCTION add_admin_user TO authenticated;
