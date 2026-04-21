/**
 * useTrackAccess — Registra automaticamente o acesso do paciente ao app.
 * Insere um registro em access_logs sempre que o paciente faz login/abre o app.
 * Usa sessionStorage para evitar registrar múltiplas vezes na mesma sessão de aba.
 */

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SESSION_FLAG = "proalta_access_logged";

export const useTrackAccess = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Evita inserir o mesmo log várias vezes na mesma sessão de navegação
    if (sessionStorage.getItem(SESSION_FLAG) === user.id) return;

    const logAccess = async () => {
      // Busca o hospital_id do paciente para vincular o log corretamente
      const { data: profile } = await supabase
        .from("profiles")
        .select("hospital_id")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("access_logs").insert({
        patient_id: user.id,
        hospital_id: profile?.hospital_id ?? null,
        event_type: "app_open",
      });

      sessionStorage.setItem(SESSION_FLAG, user.id);
    };

    logAccess();
  }, [user]);
};
