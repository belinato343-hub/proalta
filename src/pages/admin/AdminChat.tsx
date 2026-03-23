import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

interface Patient {
  user_id: string;
  nome: string | null;
  tipo_sonda: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const AdminChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPatientId = searchParams.get("patient");
  const { hospitalId } = useUserRole();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hospitalId) return;
    const fetchPatients = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, nome, tipo_sonda")
        .eq("hospital_id", hospitalId);
      setPatients(data ?? []);
    };
    fetchPatients();
  }, [hospitalId]);

  useEffect(() => {
    if (!selectedPatientId || !hospitalId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_id, content, created_at")
        .eq("hospital_id", hospitalId)
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${selectedPatientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `patient_id=eq.${selectedPatientId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPatientId, hospitalId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPatientId || !hospitalId || !user) return;
    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      hospital_id: hospitalId,
      patient_id: selectedPatientId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setSending(false);
    if (!error) setNewMessage("");
  };

  const selectedPatient = patients.find((p) => p.user_id === selectedPatientId);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Patient List */}
      <div className="w-72 shrink-0 overflow-y-auto rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
        </div>
        <div className="space-y-1 p-2">
          {patients.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Nenhum paciente</p>
          ) : (
            patients.map((p) => (
              <button
                key={p.user_id}
                onClick={() => setSearchParams({ patient: p.user_id })}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedPatientId === p.user_id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nome || "Paciente"}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.tipo_sonda || ""}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
        {selectedPatientId ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedPatient?.nome || "Paciente"}
                </p>
                <p className="text-xs text-muted-foreground">{selectedPatient?.tipo_sonda || ""}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </p>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`mt-1 text-xs ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4">
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
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Selecione um paciente para conversar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
