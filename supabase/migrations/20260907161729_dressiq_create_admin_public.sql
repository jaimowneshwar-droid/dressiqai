/*
# Create admin account function (public)
# Allows anyone to create an admin account from the admin login page.
# This replaces the restricted bootstrap function with an always-available version.
*/

CREATE OR REPLACE FUNCTION create_admin_account(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Check if already an admin
    IF EXISTS (SELECT 1 FROM admins WHERE user_id = v_user_id) THEN
      RAISE EXCEPTION 'An account with this email already exists.';
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

REVOKE EXECUTE ON FUNCTION create_admin_account FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION create_admin_account TO anon, authenticated;
