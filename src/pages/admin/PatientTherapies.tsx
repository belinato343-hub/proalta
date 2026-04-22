/**
 * PatientTherapies — Atribui terapias clínicas aos pacientes do hospital.
 * O admin seleciona um paciente e marca/desmarca módulos (n:n).
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useHospitalModules } from "@/hooks/useHospitalModules";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface Patient {
  user_id: string;
  nome: string | null;
}

const PatientTherapies = () => {
  const [params, setParams] = useSearchParams();
  const { hospitalId } = useUserRole();
  const { user } = useAuth();
  const { enabled: hospitalModules, loading: loadingMods } = useHospitalModules(hospitalId);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(params.get("patient") ?? "");
  const [patientTherapies, setPatientTherapies] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  // Carrega pacientes do hospital
  useEffect(() => {
    if (!hospitalId) return;
    supabase
      .from("profiles")
      .select("user_id, nome")
      .eq("hospital_id", hospitalId)
      .order("nome")
      .then(({ data }) => setPatients(data ?? []));
  }, [hospitalId]);

  // Carrega terapias do paciente selecionado
  useEffect(() => {
    if (!selectedPatient) {
      setPatientTherapies(new Set());
      return;
    }
    supabase
      .from("patient_therapies")
      .select("module_id")
      .eq("patient_id", selectedPatient)
      .then(({ data }) => {
        setPatientTherapies(new Set((data ?? []).map((t) => t.module_id)));
      });
  }, [selectedPatient]);

  const toggleTherapy = async (moduleId: string) => {
    if (!selectedPatient || !hospitalId || !user) return;
    setBusy(moduleId);
    if (patientTherapies.has(moduleId)) {
      const { error } = await supabase
        .from("patient_therapies")
        .delete()
        .eq("patient_id", selectedPatient)
        .eq("module_id", moduleId);
      if (error) toast.error("Erro ao remover terapia");
      else {
        const next = new Set(patientTherapies);
        next.delete(moduleId);
        setPatientTherapies(next);
        toast.success("Terapia removida");
      }
    } else {
      const { error } = await supabase.from("patient_therapies").insert({
        patient_id: selectedPatient,
        module_id: moduleId,
        hospital_id: hospitalId,
        assigned_by: user.id,
      });
      if (error) toast.error("Erro ao atribuir terapia");
      else {
        setPatientTherapies(new Set([...patientTherapies, moduleId]));
        toast.success("Terapia atribuída");
      }
    }
    setBusy(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Terapias dos pacientes</h1>
      </div>
      <p className="mb-6 text-muted-foreground">
        Atribua módulos clínicos a cada paciente. O paciente verá apenas o conteúdo das terapias atribuídas.
      </p>

      {/* Seletor de paciente */}
      <div className="mb-6 max-w-md">
        <label className="mb-2 block text-sm font-medium text-foreground">Paciente</label>
        <select
          value={selectedPatient}
          onChange={(e) => {
            setSelectedPatient(e.target.value);
            setParams(e.target.value ? { patient: e.target.value } : {});
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione um paciente</option>
          {patients.map((p) => (
            <option key={p.user_id} value={p.user_id}>
              {p.nome || `Paciente ${p.user_id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Módulos disponíveis
          </h2>
          {loadingMods ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : hospitalModules.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum módulo habilitado no hospital. Vá em <strong>Módulos</strong> para ativar.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {hospitalModules.map((hm) => {
                const isOn = patientTherapies.has(hm.module_id);
                return (
                  <label
                    key={hm.module_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      isOn ? "border-primary bg-primary/5" : "border-border bg-card"
                    } ${busy === hm.module_id ? "opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      disabled={busy === hm.module_id}
                      onChange={() => toggleTherapy(hm.module_id)}
                      className="h-4 w-4"
                    />
                    <span className="text-2xl">{hm.module.emoji ?? "📦"}</span>
                    <span className="font-medium text-foreground">{hm.module.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientTherapies;
