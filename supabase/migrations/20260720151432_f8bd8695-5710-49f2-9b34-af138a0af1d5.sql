-- 1) TABELA
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  emoji TEXT DEFAULT '🎬',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  module_slugs TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_hospital ON public.videos(hospital_id);
CREATE INDEX idx_videos_active ON public.videos(is_active);

-- 2) GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;

-- 3) RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado vê vídeos ativos globais ou do seu hospital
CREATE POLICY "Authenticated can view active videos"
ON public.videos FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    hospital_id IS NULL
    OR hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'hospital_admin')
  )
);

-- Admin de hospital pode criar vídeos vinculando ao SEU hospital
CREATE POLICY "Hospital admins insert own videos"
ON public.videos FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'hospital_admin')
  AND hospital_id IS NOT NULL
  AND hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Admin pode editar vídeos do próprio hospital
CREATE POLICY "Hospital admins update own videos"
ON public.videos FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hospital_admin')
  AND hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'hospital_admin')
  AND hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Admin pode excluir vídeos do próprio hospital
CREATE POLICY "Hospital admins delete own videos"
ON public.videos FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hospital_admin')
  AND hospital_id IN (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid())
);

-- 4) TRIGGER updated_at
CREATE TRIGGER videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5) SEED — 13 vídeos globais (hospital_id NULL) equivalentes ao mock atual
INSERT INTO public.videos (hospital_id, title, category, emoji, video_url, duration_seconds, module_slugs, sort_order) VALUES
(NULL, 'Higiene da Sonda',              'Cuidados Básicos', '🧼', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 200, ARRAY['nutricao-enteral'], 1),
(NULL, 'Preparo da Dieta Enteral',      'Alimentação',      '🥣', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 255, ARRAY['nutricao-enteral'], 2),
(NULL, 'Posicionamento do Paciente',    'Posição',          '🛏️', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 165, ARRAY['nutricao-enteral'], 3),
(NULL, 'Limpeza de Materiais',          'Higiene',          '✨', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 180, ARRAY['nutricao-enteral','ostomia','traqueostomia','curativos'], 4),
(NULL, 'Administração da Dieta',        'Alimentação',      '💧', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 310, ARRAY['nutricao-enteral'], 5),
(NULL, 'Prevenção de Complicações',     'Segurança',        '🛡️', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 270, ARRAY['nutricao-enteral','ostomia','traqueostomia','dialise','curativos'], 6),
(NULL, 'Cuidados com Gastrostomia',     'Sonda',            '🩺', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 230, ARRAY['nutricao-enteral'], 7),
(NULL, 'Sinais de Alerta',              'Segurança',        '⚠️', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 150, ARRAY['nutricao-enteral','ostomia','traqueostomia','dialise','curativos'], 8),
(NULL, 'Cuidados com Ostomia',          'Ostomia',          '🫁', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 220, ARRAY['ostomia'], 9),
(NULL, 'Troca da Bolsa de Ostomia',     'Ostomia',          '👜', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 240, ARRAY['ostomia'], 10),
(NULL, 'Aspiração de Traqueostomia',    'Traqueostomia',    '🌬️', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 200, ARRAY['traqueostomia'], 11),
(NULL, 'Cuidados com Cateter de Diálise','Diálise',         '💧', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 250, ARRAY['dialise'], 12),
(NULL, 'Troca de Curativo',             'Curativos',        '🩹', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 180, ARRAY['curativos'], 13);
