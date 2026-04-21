-- ============================================
-- access_logs: rastreia logins/aberturas do app
-- ============================================
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'login', -- 'login' | 'app_open'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_logs_patient ON public.access_logs(patient_id);
CREATE INDEX idx_access_logs_hospital_date ON public.access_logs(hospital_id, created_at DESC);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own access logs"
  ON public.access_logs FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can read own access logs"
  ON public.access_logs FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Hospital admin can read access logs"
  ON public.access_logs FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

-- ============================================
-- video_views: rastreia visualizações de vídeos
-- ============================================
CREATE TABLE public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  video_id TEXT NOT NULL,        -- identificador do vídeo (slug ou id)
  video_title TEXT NOT NULL,     -- título no momento da visualização
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  completion_percent INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_views_patient ON public.video_views(patient_id);
CREATE INDEX idx_video_views_hospital ON public.video_views(hospital_id, created_at DESC);
CREATE INDEX idx_video_views_video ON public.video_views(video_id);

ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own video views"
  ON public.video_views FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can read own video views"
  ON public.video_views FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Hospital admin can read video views"
  ON public.video_views FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

-- ============================================
-- readmissions: reinternações (registradas pelo admin)
-- ============================================
CREATE TABLE public.readmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  readmission_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  registered_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_readmissions_patient ON public.readmissions(patient_id);
CREATE INDEX idx_readmissions_hospital ON public.readmissions(hospital_id, readmission_date DESC);

ALTER TABLE public.readmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital admin can read readmissions"
  ON public.readmissions FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin can insert readmissions"
  ON public.readmissions FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid())
    AND registered_by = auth.uid()
  );

CREATE POLICY "Hospital admin can update readmissions"
  ON public.readmissions FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin can delete readmissions"
  ON public.readmissions FOR DELETE TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE TRIGGER set_readmissions_updated_at
  BEFORE UPDATE ON public.readmissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();