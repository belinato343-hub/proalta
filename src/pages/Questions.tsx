import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

const faqItems = [
  { q: "A sonda saiu, o que fazer?", a: "Não tente recolocar. Feche a extremidade da sonda, mantenha a calma e procure atendimento médico imediatamente." },
  { q: "Posso dar medicamentos pela sonda?", a: "Apenas medicamentos prescritos e orientados pela equipe. Sempre lave a sonda com água antes e depois." },
  { q: "A dieta pode ser esquentada?", a: "A dieta deve estar em temperatura ambiente. Nunca aqueça no micro-ondas ou fogão." },
];

interface Question {
  id: string;
  content: string;
  answer: string | null;
  created_at: string;
}

const Questions = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (user) fetchMyQuestions();
  }, [user]);

  const fetchMyQuestions = async () => {
    const { data } = await supabase
      .from("questions")
      .select("id, content, answer, created_at")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    setMyQuestions(data ?? []);
  };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);

    // Get patient's hospital_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("hospital_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("questions").insert({
      patient_id: user.id,
      hospital_id: profile?.hospital_id ?? null,
      content: message.trim(),
    });

    setSending(false);
    if (error) {
      toast.error("Erro ao enviar dúvida", { description: error.message });
    } else {
      toast.success("Dúvida enviada! A equipe responderá em breve.");
      setMessage("");
      fetchMyQuestions();
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Dúvidas</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">Perguntas frequentes e envio de dúvidas</p>

      {/* FAQ */}
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

      {/* My Questions */}
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
                <div className="mt-3 rounded-lg bg-primary/5 p-3">
                  <p className="text-xs font-medium text-primary mb-1">Resposta:</p>
                  <p className="text-sm text-foreground">{q.answer}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-accent font-medium">⏳ Aguardando resposta</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send Question */}
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
          <Send className="h-4 w-4" />
          {sending ? "Enviando..." : "Enviar Dúvida"}
        </button>
      </div>
    </div>
  );
};

export default Questions;
