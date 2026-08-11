/**
 * auto-answer — Gera resposta automática (IA) para dúvidas de pacientes.
 * Segurança: exige JWT válido. Quando um questionId é enviado, a pergunta
 * precisa pertencer ao usuário autenticado antes de qualquer gravação.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Autenticação: extrai o usuário do JWT enviado no header
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Não autenticado" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const question: unknown = body?.question;
    const questionId: unknown = body?.questionId;

    if (typeof question !== "string" || question.trim().length < 2 || question.length > 2000) {
      return json({ error: "Pergunta inválida" }, 400);
    }
    if (questionId !== undefined && questionId !== null && typeof questionId !== "string") {
      return json({ error: "questionId inválido" }, 400);
    }

    // 2. Autorização: a pergunta precisa pertencer ao chamador
    if (typeof questionId === "string" && questionId) {
      const { data: row, error: rowErr } = await admin
        .from("questions")
        .select("id, patient_id")
        .eq("id", questionId)
        .maybeSingle();

      if (rowErr) return json({ error: "Erro ao validar a pergunta" }, 500);
      if (!row) return json({ error: "Pergunta não encontrada" }, 404);
      if (row.patient_id !== userId) return json({ error: "Acesso negado" }, 403);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um assistente médico virtual especializado em cuidados com sondas enterais e gástricas (SNE, SNG, GTT, JJT). 
Responda de forma clara, empática e objetiva em português brasileiro.
Use linguagem simples que um paciente leigo possa entender.
Sempre oriente o paciente a procurar atendimento médico em caso de emergência ou dúvidas graves.
Não faça diagnósticos. Forneça orientações gerais de cuidado baseadas em boas práticas médicas.
Mantenha as respostas curtas (máximo 3 parágrafos).
Se a pergunta não for relacionada a sondas ou saúde, diga educadamente que você só pode ajudar com dúvidas sobre cuidados com sondas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: "Muitas requisições. Tente novamente em alguns segundos." }, 429);
      }
      if (response.status === 402) {
        return json({ error: "Créditos de IA esgotados." }, 402);
      }
      console.error("AI gateway error:", response.status, await response.text());
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) throw new Error("No answer from AI");

    // 3. Grava a resposta apenas na pergunta validada do próprio paciente
    if (typeof questionId === "string" && questionId) {
      await admin
        .from("questions")
        .update({ answer, answered_at: new Date().toISOString(), is_ai_answer: true })
        .eq("id", questionId)
        .eq("patient_id", userId);
    }

    return json({ answer });
  } catch (e) {
    console.error("auto-answer error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
