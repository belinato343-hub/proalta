DO $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  -- 1. Cria usuário no auth (se não existir)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'homecare@proalta.test';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'homecare@proalta.test', crypt('homecare123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}', false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    VALUES (gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'homecare@proalta.test'),
      'email', v_user_id::text, now(), now(), now());
  END IF;

  -- 2. Garante role homecare_admin (substitui a default 'patient' criada pelo handle_new_user)
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'homecare_admin');

  -- 3. Cria empresa Home Care
  INSERT INTO public.homecare_companies (name, admin_user_id)
  VALUES ('Cuidar Home Care', v_user_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_company_id;

  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM public.homecare_companies WHERE admin_user_id = v_user_id LIMIT 1;
  END IF;

  -- 4. Vincula os pacientes existentes
  INSERT INTO public.patient_homecare (patient_id, company_id, assigned_by)
  SELECT user_id, v_company_id, v_user_id
  FROM public.profiles
  WHERE nome IN ('João Silva', 'Maria Santos')
  ON CONFLICT DO NOTHING;
END $$;