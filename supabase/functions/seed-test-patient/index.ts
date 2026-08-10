// Cria/reseta um paciente de teste com senha conhecida, vinculado ao hospital,
// à empresa de home care e com terapias atribuídas.
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

  const email = "paciente@proalta.test";
  const password = "paciente123";

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
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    userId = created.user!.id;
  }

  const { data: hospital } = await admin.from("hospitals").select("id").limit(1).maybeSingle();
  const { data: company } = await admin
    .from("homecare_companies")
    .select("id")
    .limit(1)
    .maybeSingle();
  const { data: modules } = await admin
    .from("therapy_modules")
    .select("id, slug")
    .in("slug", ["nutricao-enteral", "ostomia"]);

  await admin.from("profiles").upsert(
    { user_id: userId, nome: "Paciente Teste", hospital_id: hospital?.id ?? null },
    { onConflict: "user_id" },
  );

  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("user_roles").insert({ user_id: userId, role: "patient" });

  if (company?.id) {
    await admin.from("patient_homecare").delete().eq("patient_id", userId);
    await admin.from("patient_homecare").insert({ patient_id: userId, company_id: company.id });
  }

  await admin.from("patient_therapies").delete().eq("patient_id", userId);
  for (const m of modules ?? []) {
    await admin.from("patient_therapies").insert({
      patient_id: userId,
      module_id: m.id,
      hospital_id: hospital?.id ?? null,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      email,
      password,
      user_id: userId,
      hospital_id: hospital?.id ?? null,
      company_id: company?.id ?? null,
      modules: (modules ?? []).map((m: { slug: string }) => m.slug),
    }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
