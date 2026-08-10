CREATE OR REPLACE FUNCTION public.is_hospital_admin_of(_hospital_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _hospital_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.hospitals h WHERE h.id = _hospital_id AND h.admin_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.hospital_id = _hospital_id
        AND public.has_role(auth.uid(), 'hospital_admin')
    )
  )
$$;

REVOKE ALL ON FUNCTION public.is_hospital_admin_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_hospital_admin_of(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Hospital admin can read patient profiles" ON public.profiles;
CREATE POLICY "Hospital admin can read patient profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin can read patient questions" ON public.questions;
CREATE POLICY "Hospital admin can read patient questions" ON public.questions
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin can answer questions" ON public.questions;
CREATE POLICY "Hospital admin can answer questions" ON public.questions
FOR UPDATE TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin can read patient chat" ON public.chat_messages;
CREATE POLICY "Hospital admin can read patient chat" ON public.chat_messages
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin can read access logs" ON public.access_logs;
CREATE POLICY "Hospital admin can read access logs" ON public.access_logs
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin can read video views" ON public.video_views;
CREATE POLICY "Hospital admin can read video views" ON public.video_views
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin reads patient therapies" ON public.patient_therapies;
CREATE POLICY "Hospital admin reads patient therapies" ON public.patient_therapies
FOR SELECT TO authenticated USING (public.is_hospital_admin_of(hospital_id));

DROP POLICY IF EXISTS "Hospital admin removes therapies" ON public.patient_therapies;
CREATE POLICY "Hospital admin removes therapies" ON public.patient_therapies
FOR DELETE TO authenticated USING (public.is_hospital_admin_of(hospital_id));