/**
 * Readmissions — Página do admin para registrar e gerenciar reinternações.
 * Permite selecionar um paciente do hospital, informar data, motivo e observações.
 * Os dados alimentam a correlação engajamento × reinternação no painel de Analytics.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Paciente disponível para registro */
interface PatientOption {
  user_id: string;
  nome: string | null;
}

/** Reinternação enriquecida com nome do paciente */
interface ReadmissionRow {
  id: string;
  patient_id: string;
  patient_name: string;
  readmission_date: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

const Readmissions = () => {
  const { hospitalId } = useUserRole();
  const { user } = useAuth();

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [rows, setRows] = useState<ReadmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do formulário do modal
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Carrega pacientes do hospital + reinternações já registradas */
  const fetchData = async () => {
    if (!hospitalId) return;
    setLoading(true);

    const [patientsRes, readmissionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, nome")
        .eq("hospital_id", hospitalId)
        .order("nome", { ascending: true }),
      supabase
        .from("readmissions")
        .select("id, patient_id, readmission_date, reason, notes, created_at")
        .eq("hospital_id", hospitalId)
        .order("readmission_date", { ascending: false }),
    ]);

    const pts = patientsRes.data ?? [];
    setPatients(pts);

    // Mapeia patient_id -> nome para exibir na tabela
    const nameMap = new Map(pts.map((p) => [p.user_id, p.nome]));
    setRows(
      (readmissionsRes.data ?? []).map((r) => ({
        ...r,
        patient_name: nameMap.get(r.patient_id) ?? "Paciente",
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  /** Reseta o formulário do modal */
  const resetForm = () => {
    setPatientId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setReason("");
    setNotes("");
  };

  /** Salva uma nova reinternação */
  const handleSubmit = async () => {
    if (!hospitalId || !user) return;
    if (!patientId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!date) {
      toast.error("Informe a data da reinternação");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("readmissions").insert({
      patient_id: patientId,
      hospital_id: hospitalId,
      readmission_date: date,
      reason: reason.trim() || null,
      notes: notes.trim() || null,
      registered_by: user.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Erro ao registrar: " + error.message);
      return;
    }

    toast.success("Reinternação registrada");
    setOpen(false);
    resetForm();
    fetchData();
  };

  /** Remove uma reinternação após confirmação */
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const { error } = await supabase.from("readmissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }
    toast.success("Registro excluído");
    fetchData();
  };

  return (
    <div>
      {/* Cabeçalho com CTA */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reinternações</h1>
          <p className="text-muted-foreground">
            Registre reinternações para alimentar a análise de correlação com engajamento.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova reinternação
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar reinternação</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Seleção do paciente */}
              <div className="space-y-1.5">
                <Label htmlFor="patient">Paciente</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        Nenhum paciente disponível
                      </div>
                    ) : (
                      patients.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.nome ?? "Sem nome"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <Label htmlFor="date">Data da reinternação</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  max={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  placeholder="Ex.: Obstrução de sonda, infecção..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalhes adicionais sobre o caso"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Listagem de reinternações */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">
            Nenhuma reinternação registrada
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Nova reinternação" para começar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Observações
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <User className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="font-medium text-foreground">
                        {r.patient_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(r.readmission_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.reason || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {r.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Readmissions;
