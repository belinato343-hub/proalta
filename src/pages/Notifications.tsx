/**
 * Notifications — Preferências de notificações do paciente.
 * Usa a API de Notifications do navegador + localStorage para persistir preferências.
 */

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface NotifPrefs {
  checklistReminder: boolean;
  chatReplies: boolean;
  reminderTime: string; // "HH:MM"
}

const STORAGE_KEY = "proalta:notif-prefs";

const defaultPrefs: NotifPrefs = {
  checklistReminder: true,
  chatReplies: true,
  reminderTime: "09:00",
};

const loadPrefs = (): NotifPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs;
};

const Notifications = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const supported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const requestPermission = async () => {
    if (!supported) {
      toast.error("Seu navegador não suporta notificações");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notificações ativadas!");
      new Notification("ProAlta", {
        body: "Você receberá lembretes por aqui.",
        icon: "/placeholder.svg",
      });
    } else {
      toast.error("Permissão negada", {
        description: "Habilite as notificações nas configurações do navegador.",
      });
    }
  };

  const testNotification = () => {
    if (permission !== "granted") {
      toast.error("Ative as notificações primeiro");
      return;
    }
    new Notification("Lembrete ProAlta", {
      body: "Não esqueça de conferir seu checklist diário 💙",
      icon: "/placeholder.svg",
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button
        onClick={() => navigate("/perfil")}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie lembretes e alertas do ProAlta.
        </p>
      </div>

      {/* Card de permissão do navegador */}
      <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              permission === "granted" ? "bg-primary/10" : "bg-muted"
            }`}
          >
            {permission === "granted" ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {permission === "granted"
                ? "Notificações ativadas"
                : "Permissão necessária"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {permission === "granted"
                ? "Você pode receber lembretes deste dispositivo."
                : "Autorize o navegador a enviar notificações para receber lembretes."}
            </p>
            {permission !== "granted" && (
              <Button
                size="sm"
                className="mt-3"
                onClick={requestPermission}
                disabled={!supported || permission === "denied"}
              >
                <Bell className="mr-2 h-4 w-4" />
                Ativar notificações
              </Button>
            )}
            {permission === "denied" && (
              <p className="mt-2 text-xs text-destructive">
                Permissão bloqueada. Habilite manualmente nas configurações do navegador.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex-1 pr-4">
            <p className="text-sm font-medium text-foreground">Lembrete de checklist</p>
            <p className="text-xs text-muted-foreground">
              Aviso diário para conferir seus cuidados.
            </p>
          </div>
          <Switch
            checked={prefs.checklistReminder}
            onCheckedChange={(v) =>
              setPrefs((p) => ({ ...p, checklistReminder: v }))
            }
          />
        </div>

        {prefs.checklistReminder && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">Horário do lembrete</p>
              <p className="text-xs text-muted-foreground">
                Quando enviar a notificação diária.
              </p>
            </div>
            <input
              type="time"
              value={prefs.reminderTime}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, reminderTime: e.target.value }))
              }
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex-1 pr-4">
            <p className="text-sm font-medium text-foreground">Respostas do chat</p>
            <p className="text-xs text-muted-foreground">
              Aviso quando a equipe clínica responder suas dúvidas.
            </p>
          </div>
          <Switch
            checked={prefs.chatReplies}
            onCheckedChange={(v) =>
              setPrefs((p) => ({ ...p, chatReplies: v }))
            }
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="mt-6 w-full"
        onClick={testNotification}
        disabled={permission !== "granted"}
      >
        Enviar notificação de teste
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        As preferências são salvas neste dispositivo.
      </p>
    </div>
  );
};

export default Notifications;
