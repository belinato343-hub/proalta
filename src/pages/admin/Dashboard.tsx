import { useEffect, useState } from "react";
import { Users, MessageCircle, HelpCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface Stats {
  totalPatients: number;
  pendingQuestions: number;
  totalMessages: number;
}

const Dashboard = () => {
  const { hospitalId } = useUserRole();
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, pendingQuestions: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchStats = async () => {
      const [patients, questions, messages] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("hospital_id", hospitalId).is("answer", null),
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

  const cards = [
    { label: "Pacientes", value: stats.totalPatients, icon: Users, color: "text-primary" },
    { label: "Dúvidas Pendentes", value: stats.pendingQuestions, icon: HelpCircle, color: "text-accent" },
    { label: "Mensagens", value: stats.totalMessages, icon: MessageCircle, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">Visão geral do seu hospital</p>

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
