/**
 * Questions — Tela de dúvidas do paciente.
 * Exibe FAQs, lista de dúvidas já enviadas (com respostas da IA ou equipe)
 * e formulário para envio de novas perguntas.
 * Ao enviar, chama a edge function auto-answer para gerar resposta automática via IA.
 */

import { useState, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

/** Perguntas frequentes fixas exibidas no topo da página */
const faqItems = [
  { q: "A sonda saiu, o que fazer?", a: "Não tente recolocar. Feche a extremidade da sonda, mantenha a calma e procure atendimento médico imediatamente." },
  { q: "Posso dar medicamentos pela sonda?", a: "Apenas medicamentos prescritos e orientados pela equipe. Sempre lave a sonda com água antes e depois." },
  { q: "A dieta pode ser esquentada?", a: "A dieta deve estar em temperatura ambiente. Nunca aqueça no micro-ondas ou fogão." },
];

/** Tipagem de uma pergunta enviada pelo paciente */
interface Question {
  id: string;
  content: string;
  answer: string | null;
  is_ai_answer: boolean | null;
  created_at: string;
}

const Questions = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);

  // Carrega as dúvidas do paciente ao montar
  useEffect(() => {
    if (user) fetchMyQuestions();
  }, [user]);

  /** Busca todas as dúvidas enviadas pelo paciente logado */
  const fetchMyQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("id, content, answer, is_ai_answer, created_at")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    setMyQuestions(data ?? []);
  };

  /** Envia uma nova dúvida e solicita resposta automática da IA */
  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);

    // Busca o hospital_id do paciente para vincular a dúvida
    const { data: profile } = await supabase
      .from("profiles")
      .select("hospital_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Insere a dúvida na tabela questions
    const { data: inserted, error } = await supabase.from("questions").insert({
      patient_id: user.id,
      hospital_id: profile?.hospital_id ?? null,
      content: message.trim(),
    }).select("id").single();

    if (error) {
      setSending(false);
      toast.error("Erro ao enviar dúvida", { description: error.message });
      return;
    }

    const questionText = message.trim();
    setMessage("");
    toast.success("Dúvida enviada! Gerando resposta automática...");
    fetchMyQuestions();

    // Chama a edge function de resposta automática por IA
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke("auto-answer", {
        body: { question: questionText, questionId: inserted?.id },
      });

      if (aiError) {
        console.error("Erro da IA:", aiError);
        toast.info("Não foi possível gerar resposta automática. A equipe responderá em breve.");
      } else if (aiData?.answer) {
        toast.success("Resposta automática gerada!");
      }
    } catch (e) {
      console.error("Falha na chamada da IA:", e);
    }

    setSending(false);
    fetchMyQuestions(); // Recarrega para exibir a resposta da IA
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Dúvidas</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">Perguntas frequentes e envio de dúvidas</p>

      {/* Seção de Perguntas Frequentes (FAQ) */}
      <div className="mb-8 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Perguntas Frequentes</h2>
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="animate-slide-up rounded-xl bg-card border border-border p-4 shadow-sm"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <p className="text-sm font-semibold text-foreground">{item.q}</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Lista de dúvidas já enviadas pelo paciente */}
      {myQuestions.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Minhas Dúvidas</h2>
          {myQuestions.map((q) => (
            <div key={q.id} className="rounded-xl bg-card border border-border p-4 shadow-sm">
              <p className="text-sm text-foreground">{q.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(q.created_at).toLocaleDateString("pt-BR")}
              </p>
              {q.answer ? (
                /* Exibe a resposta com badge indicando se é da IA ou da equipe */
                <div className="mt-3 rounded-lg bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {q.is_ai_answer ? (
                      <>
                        <Bot className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">Resposta da IA</p>
                      </>
                    ) : (
                      <>
                        <UserIcon className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">Resposta da equipe</p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{q.answer}</p>
                  {q.is_ai_answer && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      ⚠️ Resposta gerada por IA. A equipe médica pode revisar e complementar.
                    </p>
                  )}
                </div>
              ) : (
                /* Indicador de carregamento enquanto a IA processa a resposta */
                <div className="mt-2 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <p className="text-xs text-accent font-medium">Gerando resposta...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário para envio de nova dúvida */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Envie sua dúvida</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva sua pergunta aqui..."
          className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Dúvida
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Questions;
