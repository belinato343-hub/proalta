/**
 * PatientChat — Tela de chat do paciente com o hospital.
 * Exibe mensagens em tempo real usando Supabase Realtime.
 * Só funciona se o paciente estiver vinculado a um hospital.
 */

import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

/** Tipagem de uma mensagem do chat */
interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const PatientChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
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
  }, [messages]);

  /** Envia uma nova mensagem para o hospital */
  const handleSend = async () => {
    if (!newMessage.trim() || !hospitalId || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      hospital_id: hospitalId,
      patient_id: user.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setSending(false);
    setNewMessage("");
  };

  // Tela de carregamento
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Mensagem quando o paciente não está vinculado a nenhum hospital
  if (!hospitalId) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-12 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-foreground">Chat não disponível</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Você precisa estar vinculado a um hospital para usar o chat.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4" style={{ height: "calc(100vh - 5rem)" }}>
      <h1 className="py-4 text-xl font-bold text-foreground">Chat com Hospital</h1>

      {/* Área de mensagens com scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Envie uma mensagem para iniciar a conversa com o hospital.
          </p>
        ) : (
          messages.map((msg) => {
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
                  <p className="text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {/* Elemento âncora para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de input para envio de mensagens */}
      <div className="border-t border-border py-3">
        <div className="flex gap-3">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
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
