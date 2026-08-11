// Cria/reseta o paciente de teste, vinculado ao hospital, à empresa de home care
// e com terapias atribuídas.
// Protegido: exige ALLOW_SEED=true + JWT de um usuário com role hospital_admin.
// A senha vem do secret SEED_PATIENT_PASSWORD — nunca do código.
import { adminClient, cors, guardSeed, jsonResponse, requiredSecret } from "../_shared/seed-guard.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = adminClient();
  const blocked = await guardSeed(req, admin);
  if (blocked) return blocked;

  try {
    const email = "paciente@proalta.test";
    const password = requiredSecret("SEED_PATIENT_PASSWORD");

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
      if (error) return jsonResponse({ error: error.message }, 400);
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

    return jsonResponse({
      ok: true,
      email,
      user_id: userId,
      hospital_id: hospital?.id ?? null,
      company_id: company?.id ?? null,
      modules: (modules ?? []).map((m: { slug: string }) => m.slug),
    });
  } catch (e) {
    console.error("seed-test-patient error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
