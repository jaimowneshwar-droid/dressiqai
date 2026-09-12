/*
# Self-register as admin function
# Called after a user signs up via supabase.auth.signUp().
# Inserts the current authenticated user into the admins table.
# SECURITY DEFINER bypasses RLS so the new user can add themselves.
*/

CREATE OR REPLACE FUNCTION self_register_as_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get the caller's email from auth
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  -- Insert the caller into admins (idempotent)
  INSERT INTO admins (user_id, email)
  VALUES (auth.uid(), v_user_email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION self_register_as_admin FROM anon;
GRANT EXECUTE ON FUNCTION self_register_as_admin TO authenticated;
