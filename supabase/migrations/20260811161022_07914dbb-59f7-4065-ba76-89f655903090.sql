-- 1) Impede troca de hospital_id por usuário comum
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
    IF v_role NOT IN ('service_role', 'postgres', 'supabase_admin')
       AND NOT public.has_role(auth.uid(), 'hospital_admin') THEN
      RAISE EXCEPTION 'Alteração de hospital_id não permitida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_profile_hospital_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_prevent_hospital_change ON public.profiles;
CREATE TRIGGER profiles_prevent_hospital_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_hospital_change();

-- 2) Paciente só envia mensagem para o hospital do próprio perfil
DROP POLICY IF EXISTS "Patients can send messages" ON public.chat_messages;
CREATE POLICY "Patients can send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id = auth.uid()
  AND sender_id = auth.uid()
  AND hospital_id = (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
);