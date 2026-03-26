/**
 * Dashboard — Painel principal do administrador hospitalar.
 * Exibe métricas resumidas: total de pacientes, dúvidas pendentes e mensagens.
 * Os dados são buscados via Supabase e filtrados pelo hospital_id do admin.
 */

import { useEffect, useState } from "react";
import { Users, MessageCircle, HelpCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

/** Tipagem das estatísticas do dashboard */
interface Stats {
  totalPatients: number;
  pendingQuestions: number;
  totalMessages: number;
}

const Dashboard = () => {
  const { hospitalId } = useUserRole();
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, pendingQuestions: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);

  // Busca as estatísticas ao montar, somente quando o hospitalId está disponível
  useEffect(() => {
    if (!hospitalId) return;

    const fetchStats = async () => {
      // Faz 3 consultas em paralelo para otimizar o carregamento
      const [patients, questions, messages] = await Promise.all([
        // Total de pacientes vinculados ao hospital
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId),
        // Dúvidas ainda sem resposta
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId).is("answer", null),
        // Total de mensagens trocadas no chat
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId),
      ]);

      setStats({
        totalPatients: patients.count ?? 0,
        pendingQuestions: questions.count ?? 0,
        totalMessages: messages.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, [hospitalId]);

  /** Configuração dos cards de métricas */
  const cards = [
    { label: "Pacientes", value: stats.totalPatients, icon: Users, color: "text-primary" },
    { label: "Dúvidas Pendentes", value: stats.pendingQuestions, icon: HelpCircle, color: "text-accent" },
    { label: "Mensagens", value: stats.totalMessages, icon: MessageCircle, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">Visão geral do seu hospital</p>

      {/* Grid de cards de métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {loading ? "—" : card.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerta exibido quando o admin não tem hospital vinculado */}
      {!hospitalId && !loading && (
        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/10 p-6 text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 text-accent" />
          <p className="font-medium text-foreground">Nenhum hospital vinculado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre em contato com o suporte para configurar seu hospital.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
