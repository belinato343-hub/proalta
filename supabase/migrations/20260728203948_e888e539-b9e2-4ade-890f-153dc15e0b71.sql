-- Vídeos: admins de hospital podem editar/excluir também vídeos globais (hospital_id NULL)
DROP POLICY IF EXISTS "Hospital admins update own videos" ON public.videos;
DROP POLICY IF EXISTS "Hospital admins delete own videos" ON public.videos;

CREATE POLICY "Hospital admins update videos" ON public.videos
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'hospital_admin'::app_role)
  AND (hospital_id IS NULL OR hospital_id IN (SELECT profiles.hospital_id FROM profiles WHERE profiles.user_id = auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'hospital_admin'::app_role)
  AND (hospital_id IS NULL OR hospital_id IN (SELECT profiles.hospital_id FROM profiles WHERE profiles.user_id = auth.uid()))
);

CREATE POLICY "Hospital admins delete videos" ON public.videos
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'hospital_admin'::app_role)
  AND (hospital_id IS NULL OR hospital_id IN (SELECT profiles.hospital_id FROM profiles WHERE profiles.user_id = auth.uid()))
);

-- Módulos clínicos: admins de hospital podem gerenciar
CREATE POLICY "Hospital admins insert modules" ON public.therapy_modules
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'hospital_admin'::app_role));

CREATE POLICY "Hospital admins update modules" ON public.therapy_modules
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'hospital_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hospital_admin'::app_role));

CREATE POLICY "Hospital admins delete modules" ON public.therapy_modules
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'hospital_admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.therapy_modules TO authenticated;