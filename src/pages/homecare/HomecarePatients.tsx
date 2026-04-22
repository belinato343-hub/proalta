/**
 * HomecarePatients — Lista pacientes vinculados à empresa de Home Care.
 * Permite vincular novo paciente por user_id (cadastro manual por enquanto).
 */

import { useEffect, useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomecareCompany } from "@/hooks/useHomecareCompany";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PatientLink {
  id: string;
  patient_id: string;
  assigned_at: string;
  profile?: { nome: string | null } | null;
}

const HomecarePatients = () => {
  const { user } = useAuth();
  const { companyId } = useHomecareCompany();
  const [links, setLinks] = useState<PatientLink[]>([]);
  const [newPatientId, setNewPatientId] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("patient_homecare")
      .select("id, patient_id, assigned_at")
      .eq("company_id", companyId)
      .order("assigned_at", { ascending: false });

    const ids = (data ?? []).map((d) => d.patient_id);
    let profiles: Record<string, { nome: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", ids);
      profiles = Object.fromEntries((profs ?? []).map((p) => [p.user_id, { nome: p.nome }]));
    }
    setLinks(
      (data ?? []).map((d) => ({ ...d, profile: profiles[d.patient_id] ?? null }))
    );
  };

  useEffect(() => {
    refresh();
  }, [companyId]);

  const addPatient = async () => {
    if (!companyId || !user || !newPatientId.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("patient_homecare").insert({
      patient_id: newPatientId.trim(),
      company_id: companyId,
      assigned_by: user.id,
    });
    if (error) toast.error("Erro ao vincular paciente", { description: error.message });
    else {
      toast.success("Paciente vinculado");
      setNewPatientId("");
      await refresh();
    }
    setBusy(false);
  };

  const removeLink = async (id: string) => {
    const { error } = await supabase.from("patient_homecare").delete().eq("id", id);
    if (error) toast.error("Erro ao remover vínculo");
    else {
      toast.success("Vínculo removido");
      await refresh();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Pacientes em Home Care</h1>
      </div>

      {/* Form de adição */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium text-foreground">Vincular novo paciente</p>
        <div className="flex gap-2">
          <Input
            placeholder="ID do paciente (UUID)"
            value={newPatientId}
            onChange={(e) => setNewPatientId(e.target.value)}
          />
          <Button onClick={addPatient} disabled={busy || !newPatientId.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Vincular
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          O paciente precisa já ter conta no app. Use o user_id (UUID) do cadastro dele.
        </p>
      </div>

      {/* Lista */}
      {links.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum paciente vinculado ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-foreground">
                  {l.profile?.nome ?? `Paciente ${l.patient_id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vinculado em {new Date(l.assigned_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => removeLink(l.id)}
                className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                aria-label="Remover vínculo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomecarePatients;
