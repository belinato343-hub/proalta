/**
 * HomecareInvites — Página /homecare/convites para empresa de Home Care gerar/gerenciar convites.
 */

import InvitesManager from "@/components/InvitesManager";
import { useUserRole } from "@/hooks/useUserRole";

const HomecareInvites = () => {
  const { homecareCompanyId, loading } = useUserRole();
  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  return (
    <InvitesManager
      companyId={homecareCompanyId}
      title="Convites de cadastro"
      description="Gere links únicos para convidar pacientes da sua empresa a se cadastrarem."
    />
  );
};

export default HomecareInvites;
