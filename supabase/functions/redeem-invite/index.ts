/**
 * redeem-invite — Edge function que valida um convite, cria a conta do paciente
 * e vincula automaticamente ao hospital ou empresa de home care, com terapia opcional.
 *
 * Fluxo:
 * 1. Recebe { token, email, password, nome }
 * 2. Valida invite (existe, não revogado, não usado)
 * 3. Cria usuário (admin API) com metadata invite_token (para o trigger pular role default)
 * 4. Vincula: profile.hospital_id, user_roles.patient, patient_therapies (se módulo) ou patient_homecare
 * 5. Marca invite como redeemed
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RedeemBody {
  token: string;
  email: string;
  password: string;
  nome: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, email, password, nome }: RedeemBody = await req.json();

    // Validações básicas
    if (!token || !email || !password || !nome) {
      return json({ error: "Dados incompletos" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Senha deve ter no mínimo 6 caracteres" }, 400);
    }
    if (nome.trim().length < 2 || nome.length > 120) {
      return json({ error: "Nome inválido" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Busca invite
    const { data: invite, error: inviteErr } = await admin
      .from("patient_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr) return json({ error: "Erro ao validar convite" }, 500);
    if (!invite) return json({ error: "Convite não encontrado" }, 404);
    if (invite.revoked_at) return json({ error: "Convite revogado" }, 410);
    if (invite.redeemed_at) return json({ error: "Convite já utilizado" }, 410);

    // 2. Cria usuário (email já confirmado — a validação é o próprio invite)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { invite_token: token, nome },
    });

    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Erro ao criar conta" }, 400);
    }
    const userId = created.user.id;

    // 3. Atualiza profile (o trigger já criou linha vazia)
    await admin
      .from("profiles")
      .update({ nome, hospital_id: invite.hospital_id })
      .eq("user_id", userId);

    // 4. Garante role 'patient' (trigger pulou por causa do invite_token metadata)
    await admin.from("user_roles").insert({ user_id: userId, role: "patient" });

    // 5. Vincula a hospital (com terapia opcional) ou home care
    if (invite.hospital_id && invite.module_id) {
      await admin.from("patient_therapies").insert({
        patient_id: userId,
        module_id: invite.module_id,
        hospital_id: invite.hospital_id,
        assigned_by: invite.created_by,
      });
    }
    if (invite.company_id) {
      await admin.from("patient_homecare").insert({
        patient_id: userId,
        company_id: invite.company_id,
        assigned_by: invite.created_by,
      });
    }

    // 6. Marca invite como usado
    await admin
      .from("patient_invites")
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: userId })
      .eq("id", invite.id);

    return json({ success: true, user_id: userId });
  } catch (e) {
    console.error("redeem-invite error", e);
    return json({ error: "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
