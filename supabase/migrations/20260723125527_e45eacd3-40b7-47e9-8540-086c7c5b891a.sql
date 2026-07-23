
-- Hardening: revogar EXECUTE público das funções SECURITY DEFINER e conceder somente onde necessário

-- 1) handle_new_user: usada apenas como trigger em auth.users
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2) handle_updated_at: usada apenas como trigger
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 3) has_role: usada em políticas RLS (avaliadas como authenticated)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 4) is_homecare_admin_of: usada em políticas RLS
REVOKE ALL ON FUNCTION public.is_homecare_admin_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_homecare_admin_of(uuid) TO authenticated;

-- 5) get_invite_preview: chamada na tela pública de cadastro (anon) e signup autenticado
REVOKE ALL ON FUNCTION public.get_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon, authenticated;
