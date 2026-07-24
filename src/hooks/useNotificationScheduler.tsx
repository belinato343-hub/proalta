/**
 * useNotificationScheduler — Agenda o lembrete diário de checklist
 * enquanto o app está aberto, respeitando as preferências salvas.
 */

import { useEffect } from "react";

interface NotifPrefs {
  checklistReminder: boolean;
  chatReplies: boolean;
  reminderTime: string;
}

const STORAGE_KEY = "proalta:notif-prefs";
const LAST_FIRED_KEY = "proalta:notif-last-fired";

const readPrefs = (): NotifPrefs | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const useNotificationScheduler = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const tick = () => {
      const prefs = readPrefs();
      if (!prefs?.checklistReminder) return;
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const [h, m] = (prefs.reminderTime || "09:00").split(":").map(Number);
      if (now.getHours() !== h || now.getMinutes() !== m) return;

      const today = now.toISOString().slice(0, 10);
      if (localStorage.getItem(LAST_FIRED_KEY) === today) return;

      new Notification("Lembrete ProAlta", {
        body: "Não esqueça de conferir seu checklist diário 💙",
        icon: "/placeholder.svg",
      });
      localStorage.setItem(LAST_FIRED_KEY, today);
    };

    const interval = window.setInterval(tick, 30_000);
    tick();
    return () => window.clearInterval(interval);
  }, []);
};
