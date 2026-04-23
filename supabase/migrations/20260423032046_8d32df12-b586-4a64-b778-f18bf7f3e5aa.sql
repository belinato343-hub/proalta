
-- Tabela de convites para cadastro de pacientes
CREATE TABLE public.patient_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.homecare_companies(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.therapy_modules(id) ON DELETE SET NULL,
  patient_name text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz,
  redeemed_by uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  CONSTRAINT invite_belongs_to_org CHECK (
    (hospital_id IS NOT NULL AND company_id IS NULL) OR
    (hospital_id IS NULL AND company_id IS NOT NULL)
  )
);

CREATE INDEX idx_patient_invites_token ON public.patient_invites(token);
CREATE INDEX idx_patient_invites_hospital ON public.patient_invites(hospital_id);
CREATE INDEX idx_patient_invites_company ON public.patient_invites(company_id);

ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- Hospital admin gerencia convites do próprio hospital
CREATE POLICY "Hospital admin reads own invites"
  ON public.patient_invites FOR SELECT TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

CREATE POLICY "Hospital admin creates invites"
  ON public.patient_invites FOR INSERT TO authenticated
  WITH CHECK (
    hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Hospital admin revokes own invites"
  ON public.patient_invites FOR UPDATE TO authenticated
  USING (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()))
  WITH CHECK (hospital_id IN (SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()));

-- Home care admin gerencia convites da própria empresa
CREATE POLICY "Homecare admin reads own invites"
  ON public.patient_invites FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND public.is_homecare_admin_of(company_id));

CREATE POLICY "Homecare admin creates invites"
  ON public.patient_invites FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND public.is_homecare_admin_of(company_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Homecare admin revokes own invites"
  ON public.patient_invites FOR UPDATE TO authenticated
  USING (company_id IS NOT NULL AND public.is_homecare_admin_of(company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_homecare_admin_of(company_id));

-- Função pública (sem auth) para validar invite na tela de signup
-- Retorna apenas dados não-sensíveis para mostrar "Você está sendo convidado pelo Hospital X"
CREATE OR REPLACE FUNCTION public.get_invite_preview(_token text)
RETURNS TABLE (
  valid boolean,
  hospital_name text,
  company_name text,
  module_name text,
  patient_name text,
  reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.patient_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.patient_invites WHERE token = _token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'not_found'::text;
    RETURN;
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'revoked'::text;
    RETURN;
  END IF;

  IF v_invite.redeemed_at IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'already_used'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    true,
    (SELECT name FROM public.hospitals WHERE id = v_invite.hospital_id),
    (SELECT name FROM public.homecare_companies WHERE id = v_invite.company_id),
    (SELECT name FROM public.therapy_modules WHERE id = v_invite.module_id),
    v_invite.patient_name,
    'ok'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon, authenticated;

-- Ajusta handle_new_user: não cria role 'patient' se o usuário veio via invite
-- (a edge function redeem-invite cuida disso). Detectamos pela presença do
-- metadata 'invite_token' setado no signUp options.data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  -- Só cria role default se NÃO veio via invite (nesse caso a edge function vincula tudo)
  IF (NEW.raw_user_meta_data->>'invite_token') IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  END IF;
  RETURN NEW;
END;
$$;
