/**
 * AdminQuestions — Painel de dúvidas dos pacientes para o admin hospitalar.
 * Exibe dúvidas pendentes (sem resposta) e já respondidas.
 * Permite responder dúvidas com campo de texto, sobrescrevendo respostas da IA se necessário.
 */

import { useEffect, useState } from "react";
import { HelpCircle, Send, Check, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

/** Tipagem de uma dúvida com dados do paciente */
interface Question {
  id: string;
  patient_id: string;
  content: string;
  answer: string | null;
  is_ai_answer: boolean | null;
  answered_at: string | null;
  created_at: string;
  patient_name?: string;
}

const AdminQuestions = () => {
  const { hospitalId } = useUserRole();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Rascunhos de resposta por ID
  const [saving, setSaving] = useState<string | null>(null); // ID da pergunta sendo salva

  // Busca as dúvidas ao montar, filtradas pelo hospital
  useEffect(() => {
    if (!hospitalId) return;
    fetchQuestions();
  }, [hospitalId]);

  /** Busca todas as dúvidas do hospital e enriquece com nomes dos pacientes */
  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("hospital_id", hospitalId!)
      .order("created_at", { ascending: false });

    if (data) {
      // Busca os nomes dos pacientes para exibir junto à dúvida
      const patientIds = [...new Set(data.map((q) => q.patient_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", patientIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.nome]) ?? []);
      setQuestions(data.map((q) => ({ ...q, patient_name: nameMap.get(q.patient_id) ?? undefined })));
    }
    setLoading(false);
  };

  /** Envia a resposta do admin para uma dúvida específica */
  const handleAnswer = async (questionId: string) => {
    const answerText = answers[questionId]?.trim();
    if (!answerText) return;

    setSaving(questionId);
    const { error } = await supabase
      .from("questions")
      .update({
        answer: answerText,
        answered_at: new Date().toISOString(),
        answered_by: user!.id,
      })
      .eq("id", questionId);

    setSaving(null);
    if (error) {
      toast.error("Erro ao responder", { description: error.message });
    } else {
      toast.success("Resposta enviada!");
      setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      fetchQuestions(); // Recarrega a lista
    }
  };

  // Separa as dúvidas em pendentes e respondidas
  const pending = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Dúvidas dos Pacientes</h1>
      <p className="mb-6 text-muted-foreground">Responda as dúvidas enviadas pelos pacientes</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : questions.length === 0 ? (
        /* Estado vazio */
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhuma dúvida recebida</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Seção de dúvidas pendentes */}
          {pending.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
                Pendentes ({pending.length})
              </h2>
              <div className="space-y-4">
                {pending.map((q) => (
                  <div key={q.id} className="rounded-xl border border-accent/30 bg-card p-5 shadow-sm">
                    {/* Nome do paciente e data */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{q.patient_name || "Paciente"}</span>
                      <span className="text-xs text-muted-foreground">
                        · {new Date(q.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-foreground">{q.content}</p>
                    {/* Campo para escrever a resposta */}
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                    />
                    <Button
                      onClick={() => handleAnswer(q.id)}
                      disabled={saving === q.id || !answers[q.id]?.trim()}
                      className="mt-3"
                      size="sm"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {saving === q.id ? "Enviando..." : "Responder"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção de dúvidas já respondidas */}
          {answered.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Respondidas ({answered.length})
              </h2>
              <div className="space-y-3">
                {answered.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{q.patient_name || "Paciente"}</span>
                      <span className="text-xs text-muted-foreground">
                        · {new Date(q.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <Check className="h-4 w-4 text-primary" />
                      {/* Badge indicando se a resposta foi gerada por IA */}
                      {q.is_ai_answer && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Bot className="h-3 w-3" /> IA
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{q.content}</p>
                    <div className="mt-3 rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary mb-1">Resposta:</p>
                      <p className="text-sm text-foreground">{q.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;
