-- =========================================================
-- FASE 2 — Multi-terapia
-- =========================================================

-- Catálogo global de módulos clínicos
CREATE TABLE public.therapy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  emoji text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.therapy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read therapy modules"
ON public.therapy_modules FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.therapy_modules (slug, name, description, emoji) VALUES
  ('nutricao-enteral', 'Nutrição Enteral', 'Sondas nasogástrica, nasoenteral, gastrostomia e jejunostomia', '🥣'),
  ('ostomia', 'Ostomia', 'Colostomia, ileostomia e urostomia', '🎗️'),
  ('traqueostomia', 'Traqueostomia', 'Cuidados com cânula e via aérea', '🫁'),
  ('dialise', 'Diálise', 'Diálise peritoneal e hemodiálise domiciliar', '💧'),
  ('curativos', 'Curativos', 'Feridas crônicas, lesões por pressão e curativos complexos', '🩹');

-- Módulos habilitados por hospital
CREATE TABLE public.hospital_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.therapy_modules(id) ON DELETE CASCADE,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  enabled_by uuid,
  UNIQUE (hospital_id, module_id)
);

ALTER TABLE public.hospital_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital admin reads own modules"
ON public.hospital_modules FOR SELECT
TO authenticated
USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin enables modules"
ON public.hospital_modules FOR INSERT
TO authenticated
WITH CHECK (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin disables modules"
ON public.hospital_modules FOR DELETE
TO authenticated
USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

-- Patients also need to read which modules their hospital has enabled (to filter content)
CREATE POLICY "Patients read their hospital modules"
ON public.hospital_modules FOR SELECT
TO authenticated
USING (hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid()));

-- Terapias atribuídas ao paciente (n:n)
CREATE TABLE public.patient_therapies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.therapy_modules(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE (patient_id, module_id)
);

ALTER TABLE public.patient_therapies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own therapies"
ON public.patient_therapies FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Hospital admin reads patient therapies"
ON public.patient_therapies FOR SELECT
TO authenticated
USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin assigns therapies"
ON public.patient_therapies FOR INSERT
TO authenticated
WITH CHECK (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin removes therapies"
ON public.patient_therapies FOR DELETE
TO authenticated
USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

-- =========================================================
-- FASE 3 — Home Care (B2B)
-- =========================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'homecare_admin';

CREATE TABLE public.homecare_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homecare_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homecare admin reads own company"
ON public.homecare_companies FOR SELECT
TO authenticated
USING (admin_user_id = auth.uid());

CREATE POLICY "Homecare admin updates own company"
ON public.homecare_companies FOR UPDATE
TO authenticated
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());

CREATE TRIGGER homecare_companies_updated_at
BEFORE UPDATE ON public.homecare_companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Security definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_homecare_admin_of(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.homecare_companies
    WHERE id = _company_id AND admin_user_id = auth.uid()
  )
$$;

CREATE TABLE public.patient_homecare (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.homecare_companies(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE (patient_id, company_id)
);

ALTER TABLE public.patient_homecare ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient reads own homecare link"
ON public.patient_homecare FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Homecare admin reads company patients"
ON public.patient_homecare FOR SELECT
TO authenticated
USING (public.is_homecare_admin_of(company_id));

CREATE POLICY "Homecare admin links patients"
ON public.patient_homecare FOR INSERT
TO authenticated
WITH CHECK (public.is_homecare_admin_of(company_id));

CREATE POLICY "Homecare admin unlinks patients"
ON public.patient_homecare FOR DELETE
TO authenticated
USING (public.is_homecare_admin_of(company_id));

-- Allow homecare admin to read profiles of their patients
CREATE POLICY "Homecare admin reads patient profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT patient_id FROM public.patient_homecare ph
    WHERE public.is_homecare_admin_of(ph.company_id)
  )
);

-- Allow homecare admin to read engagement data of their patients
CREATE POLICY "Homecare admin reads patient access logs"
ON public.access_logs FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT patient_id FROM public.patient_homecare ph
    WHERE public.is_homecare_admin_of(ph.company_id)
  )
);

CREATE POLICY "Homecare admin reads patient video views"
ON public.video_views FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT patient_id FROM public.patient_homecare ph
    WHERE public.is_homecare_admin_of(ph.company_id)
  )
);

CREATE POLICY "Homecare admin reads patient questions"
ON public.questions FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT patient_id FROM public.patient_homecare ph
    WHERE public.is_homecare_admin_of(ph.company_id)
  )
);