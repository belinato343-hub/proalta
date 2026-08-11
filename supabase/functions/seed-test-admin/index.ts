// Cria/reseta os administradores de teste (hospital e home care).
// Protegido: exige ALLOW_SEED=true + JWT de um usuário com role hospital_admin.
// As senhas vêm de secrets (SEED_ADMIN_PASSWORD / SEED_HOMECARE_PASSWORD) — nunca do código.
import { adminClient, cors, guardSeed, jsonResponse, requiredSecret } from "../_shared/seed-guard.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = adminClient();
  const blocked = await guardSeed(req, admin);
  if (blocked) return blocked;

  try {
    const hospitalEmail = "admin@proalta.test";
    const homecareEmail = "homecare@proalta.test";
    const hospitalPassword = requiredSecret("SEED_ADMIN_PASSWORD");
    const homecarePassword = requiredSecret("SEED_HOMECARE_PASSWORD");

    const { data: list } = await admin.auth.admin.listUsers();

    const ensureUser = async (email: string, password: string) => {
      const existing = list?.users?.find((u) => u.email === email);
      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
        return existing.id;
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      return created.user!.id;
    };

    const hospitalAdminId = await ensureUser(hospitalEmail, hospitalPassword);
    const homecareAdminId = await ensureUser(homecareEmail, homecarePassword);

    const { data: hospital } = await admin.from("hospitals").select("id").limit(1).maybeSingle();
    const { data: company } = await admin
      .from("homecare_companies")
      .select("id")
      .limit(1)
      .maybeSingle();

    await admin.from("profiles").upsert(
      { user_id: hospitalAdminId, nome: "Admin Teste", hospital_id: hospital?.id ?? null },
      { onConflict: "user_id" },
    );
    await admin.from("user_roles").delete().eq("user_id", hospitalAdminId);
    await admin.from("user_roles").insert({ user_id: hospitalAdminId, role: "hospital_admin" });

    await admin.from("profiles").upsert(
      { user_id: homecareAdminId, nome: "Home Care Teste" },
      { onConflict: "user_id" },
    );
    await admin.from("user_roles").delete().eq("user_id", homecareAdminId);
    await admin.from("user_roles").insert({ user_id: homecareAdminId, role: "homecare_admin" });

    if (company?.id) {
      await admin.from("homecare_companies").update({ admin_user_id: homecareAdminId }).eq("id", company.id);
    }

    return jsonResponse({
      ok: true,
      hospital_admin: hospitalEmail,
      homecare_admin: homecareEmail,
      hospital_id: hospital?.id ?? null,
      company_id: company?.id ?? null,
    });
  } catch (e) {
    console.error("seed-test-admin error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
