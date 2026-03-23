
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'hospital_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create hospitals table
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Hospital admins can read their own hospital
CREATE POLICY "Admin can read own hospital"
  ON public.hospitals FOR SELECT
  TO authenticated
  USING (admin_user_id = auth.uid());

-- Hospital admins can update their own hospital
CREATE POLICY "Admin can update own hospital"
  ON public.hospitals FOR UPDATE
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());

-- Add hospital_id to profiles
ALTER TABLE public.profiles ADD COLUMN hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL;

-- Hospital admins can read profiles of their patients
CREATE POLICY "Hospital admin can read patient profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    hospital_id IS NOT NULL 
    AND hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
  );

-- Create questions table (patient questions to hospital)
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  content text NOT NULL,
  answer text,
  answered_at timestamptz,
  answered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own questions
CREATE POLICY "Patients can insert own questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- Patients can read their own questions
CREATE POLICY "Patients can read own questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Hospital admins can read questions from their patients
CREATE POLICY "Hospital admin can read patient questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
  );

-- Hospital admins can update (answer) questions
CREATE POLICY "Hospital admin can answer questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
  );

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Patients can read their own chat messages
CREATE POLICY "Patients can read own chat"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Patients can send messages
CREATE POLICY "Patients can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid() AND sender_id = auth.uid());

-- Hospital admins can read chat messages from their patients
CREATE POLICY "Hospital admin can read patient chat"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
  );

-- Hospital admins can send messages to their patients
CREATE POLICY "Hospital admin can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM public.hospitals WHERE admin_user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Auto-assign patient role on signup (update existing trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

-- Updated_at trigger for hospitals
CREATE TRIGGER set_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
