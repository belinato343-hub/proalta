/**
 * HomecareDashboard — Dashboard inicial para empresas de Home Care.
 * Mostra contagem de pacientes vinculados e atalhos.
 */

import { useEffect, useState } from "react";
import { Users, Activity, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHomecareCompany } from "@/hooks/useHomecareCompany";

const HomecareDashboard = () => {
  const navigate = useNavigate();
  const { companyId, companyName } = useHomecareCompany();
  const [stats, setStats] = useState({ patients: 0, accessesLast7: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      const { data: links } = await supabase
        .from("patient_homecare")
        .select("patient_id")
        .eq("company_id", companyId);
      const patientIds = (links ?? []).map((l) => l.patient_id);

      let accessesLast7 = 0;
      if (patientIds.length) {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("access_logs")
          .select("*", { count: "exact", head: true })
          .in("patient_id", patientIds)
          .gte("created_at", cutoff);
        accessesLast7 = count ?? 0;
      }
      setStats({ patients: patientIds.length, accessesLast7 });
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Olá, {companyName ?? "Home Care"}</h1>
      <p className="mb-6 text-muted-foreground">Visão geral dos seus pacientes em domicílio</p>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => navigate("/homecare/pacientes")}
          className="rounded-xl border border-border bg-card p-6 text-left shadow-sm hover:border-primary/30 transition-colors"
        >
          <Users className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">Pacientes vinculados</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{stats.patients}</p>
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Activity className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">Acessos nos últimos 7 dias</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{stats.accessesLast7}</p>
        </div>

        <button
          onClick={() => navigate("/homecare/analytics")}
          className="rounded-xl border border-border bg-card p-6 text-left shadow-sm hover:border-primary/30 transition-colors"
        >
          <BarChart3 className="mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">Ver analytics completo</p>
          <p className="mt-1 text-xs text-muted-foreground">Engajamento, vídeos e dúvidas</p>
        </button>
      </div>
    </div>
  );
};

export default HomecareDashboard;
