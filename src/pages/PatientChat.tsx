/**
 * PatientChat — Tela de chat do paciente.
 * O paciente escolhe entre falar com a assistente virtual (IA, resposta imediata)
 * ou com um atendente do hospital (mensagens em tempo real via Supabase Realtime).
 */

import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle, Bot, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

/** Tipagem de uma mensagem do chat */
interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

type ChatMode = "ai" | "human";

const PatientChat = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Busca o hospital_id do paciente e carrega as mensagens existentes
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Busca o hospital vinculado ao perfil do paciente
      const { data: profile } = await supabase
        .from("profiles")
        .select("hospital_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const hId = profile?.hospital_id ?? null;
      setHospitalId(hId);

      // Se tem hospital vinculado, carrega o histórico de mensagens
      if (hId) {
        const { data } = await supabase
          .from("chat_messages")
          .select("id, sender_id, content, created_at")
          .eq("hospital_id", hId)
          .eq("patient_id", user.id)
          .order("created_at", { ascending: true });
        setMessages(data ?? []);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // Inscrição no Supabase Realtime para receber novas mensagens instantaneamente
  useEffect(() => {
    if (!hospitalId || !user) return;
    const channel = supabase
      .channel(`patient-chat-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `patient_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    // Remove a inscrição ao desmontar o componente
    return () => { supabase.removeChannel(channel); };
  }, [hospitalId, user]);

  // Auto-scroll para a última mensagem ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages, mode, sending]);

  /** Envia mensagem para o atendente do hospital */
  const sendToHuman = async (text: string) => {
    if (!hospitalId || !user) return;
    await supabase.from("chat_messages").insert({
      hospital_id: hospitalId,
      patient_id: user.id,
      sender_id: user.id,
      content: text,
    });
  };

  /** Envia mensagem para a assistente virtual (IA) */
  const sendToAI = async (text: string) => {
    const now = new Date().toISOString();
    setAiMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender_id: user!.id, content: text, created_at: now },
    ]);

    const { data, error } = await supabase.functions.invoke("auto-answer", {
      body: { question: text },
    });

    if (error || !data?.answer) {
      toast.error("Não consegui responder agora", {
        description: "Tente novamente ou fale com um atendente do hospital.",
      });
      return;
    }

    setAiMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        sender_id: "ai",
        content: data.answer as string,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  /** Envia a mensagem conforme o modo escolhido */
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending || !user) return;
    if (mode === "human" && !hospitalId) return;

    setSending(true);
    setNewMessage("");
    if (mode === "ai") {
      await sendToAI(text);
    } else {
      await sendToHuman(text);
    }
    setSending(false);
  };

  // Tela de carregamento
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const visible = mode === "ai" ? aiMessages : messages;
  const humanUnavailable = mode === "human" && !hospitalId;

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4" style={{ height: "calc(100vh - 5rem)" }}>
      <h1 className="pt-4 text-xl font-bold text-foreground">Chat</h1>

      {/* Seletor de modo de atendimento */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "ai" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Bot className="h-4 w-4" /> Resposta automática
        </button>
        <button
          onClick={() => setMode("human")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "human" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <UserRound className="h-4 w-4" /> Falar com atendente
        </button>
      </div>
      <p className="py-2 text-xs text-muted-foreground">
        {mode === "ai"
          ? "Assistente virtual: respostas imediatas sobre seus cuidados. Em emergências, procure atendimento médico."
          : "Suas mensagens vão para a equipe do hospital e são respondidas em horário de atendimento."}
      </p>

      {/* Área de mensagens com scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {humanUnavailable ? (
          <div className="pt-10 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">Atendente não disponível</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você precisa estar vinculado a um hospital para falar com um atendente.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {mode === "ai"
              ? "Faça sua pergunta para a assistente virtual."
              : "Envie uma mensagem para iniciar a conversa com o hospital."}
          </p>
        ) : (
          visible.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {!isMine && mode === "ai" && (
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                      <Bot className="h-3 w-3" /> Assistente virtual
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {/* Indicador de digitação da IA */}
        {mode === "ai" && sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              Digitando...
            </div>
          </div>
        )}
        {/* Elemento âncora para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de input para envio de mensagens */}
      <div className="border-t border-border py-3">
        <div className="flex gap-3">
          <Input
            placeholder={mode === "ai" ? "Pergunte à assistente virtual..." : "Digite sua mensagem..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={humanUnavailable}
            className="flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || humanUnavailable}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;
