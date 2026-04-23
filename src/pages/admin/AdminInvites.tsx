/**
 * AdminInvites — Página /admin/convites para hospital gerar/gerenciar convites de cadastro.
 */

import InvitesManager from "@/components/InvitesManager";
import { useUserRole } from "@/hooks/useUserRole";

const AdminInvites = () => {
  const { hospitalId, loading } = useUserRole();
  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  return (
    <InvitesManager
      hospitalId={hospitalId}
      title="Convites de cadastro"
      description="Gere links únicos para convidar pacientes a se cadastrarem no ProAlta."
    />
  );
};

export default AdminInvites;
