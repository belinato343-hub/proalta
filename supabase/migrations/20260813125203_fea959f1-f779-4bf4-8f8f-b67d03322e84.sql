CREATE OR REPLACE FUNCTION public.prevent_profile_hospital_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.hospital_id IS DISTINCT FROM OLD.hospital_id THEN
    v_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::json->>'role',
      current_user
    );
    IF v_role NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Alteração de hospital_id não permitida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_hospital_change() FROM PUBLIC, anon, authenticated;