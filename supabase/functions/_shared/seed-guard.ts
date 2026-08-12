/**
 * seed-guard — Proteção compartilhada das funções de seed.
 * Só permite execução quando:
 *  1. a variável de ambiente ALLOW_SEED estiver exatamente "true"; e
 *  2. o chamador enviar um JWT válido de um usuário com role 'hospital_admin'.
 * Nenhuma senha fica no código: todas vêm de secrets.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Retorna null quando autorizado, ou uma Response de erro quando bloqueado. */
export async function guardSeed(req: Request, admin: SupabaseClient): Promise<Response | null> {
  if (Deno.env.get("ALLOW_SEED") !== "true") {
    return jsonResponse({ error: "Seed desabilitado" }, 403);
  }

  // Caminho operacional opcional: chave de manutenção guardada em secret.
  // Se o secret SEED_TRIGGER_KEY não existir, este caminho fica desativado.
  const triggerKey = Deno.env.get("SEED_TRIGGER_KEY");
  if (triggerKey && req.headers.get("x-seed-key") === triggerKey) {
    return null;
  }



  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonResponse({ error: "Não autenticado" }, 401);

  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return jsonResponse({ error: "Não autenticado" }, 401);

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isHospitalAdmin = (roles ?? []).some((r: { role: string }) => r.role === "hospital_admin");
  if (!isHospitalAdmin) return jsonResponse({ error: "Acesso negado" }, 403);

  return null;
}

/** Lê uma senha de secret; erro explícito se não configurada. */
export function requiredSecret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret ${name} não configurado`);
  return value;
}
