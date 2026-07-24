// Cria/reseta um hospital_admin de teste com senha conhecida.
// Uso único — pode ser removido após o seed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const email = "admin@proalta.test";
  const password = "admin123";

  // Procura user existente
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);

  let userId: string;
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    userId = created.user!.id;
  }

  // Pega o primeiro hospital pra vincular
  const { data: hospital } = await admin.from("hospitals").select("id").limit(1).maybeSingle();

  // Garante profile
  await admin.from("profiles").upsert(
    { user_id: userId, nome: "Admin Teste", hospital_id: hospital?.id ?? null },
    { onConflict: "user_id" },
  );

  // Garante role hospital_admin (remove patient default se houver)
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("user_roles").insert({ user_id: userId, role: "hospital_admin" });

  return new Response(
    JSON.stringify({ ok: true, email, password, user_id: userId, hospital_id: hospital?.id ?? null }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
