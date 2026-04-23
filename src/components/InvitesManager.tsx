/**
 * InvitesManager — Componente compartilhado para hospital e home care gerenciarem convites.
 * Recebe hospitalId OU companyId e renderiza:
 * - Botão para gerar novo convite (com nome do paciente e terapia opcional)
 * - Lista de convites existentes com status, link copiável e botão de revogar
 */

import { useState } from "react";
import { useInvites, type Invite } from "@/hooks/useInvites";
import { useHospitalModules } from "@/hooks/useHospitalModules";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Plus, Copy, Ban, Link as LinkIcon, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Props {
  hospitalId?: string | null;
  companyId?: string | null;
  title: string;
  description: string;
}

const InvitesManager = ({ hospitalId, companyId, title, description }: Props) => {
  const { invites, loading, createInvite, revokeInvite } = useInvites({ hospitalId, companyId });
  const { enabled: hospitalEnabledModules } = useHospitalModules(hospitalId ?? null);
  const hospitalModules = hospitalEnabledModules.map((hm) => hm.module);

  const [open, setOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [moduleId, setModuleId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setSubmitting(true);
    const { error } = await createInvite({
      patient_name: patientName.trim() || undefined,
      module_id: moduleId === "none" ? null : moduleId,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      const msg = typeof error === "string" ? error : error.message;
      toast.error("Erro ao gerar convite", { description: msg });
    } else {
      toast.success("Convite gerado!");
      setPatientName(""); setModuleId("none"); setNotes("");
      setOpen(false);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/cadastro?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", { description: "Envie ao paciente." });
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revogar este convite? Não poderá mais ser usado.")) return;
    const { error } = await revokeInvite(id);
    if (error) toast.error("Erro ao revogar");
    else toast.success("Convite revogado");
  };

  const renderStatus = (inv: Invite) => {
    if (inv.revoked_at) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Revogado</Badge>;
    if (inv.redeemed_at) return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Usado</Badge>;
    return <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/20"><Clock className="h-3 w-3" />Ativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo convite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar convite de cadastro</DialogTitle>
              <DialogDescription>
                Um link único será criado. Envie ao paciente — só ele poderá usar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome do paciente <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ex: João da Silva" maxLength={120} />
              </div>

              {hospitalId && hospitalModules.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="module">Pré-atribuir terapia <span className="text-muted-foreground">(opcional)</span></Label>
                  <Select value={moduleId} onValueChange={setModuleId}>
                    <SelectTrigger id="module"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma — atribuir depois</SelectItem>
                      {hospitalModules.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.emoji} {m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações internas <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: alta dia 25/04" maxLength={200} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Gerando..." : "Gerar convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : invites.length === 0 ? (
        <Card className="border-dashed border-border bg-muted/30 p-10 text-center">
          <LinkIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Nenhum convite ainda</p>
          <p className="text-xs text-muted-foreground">Gere o primeiro convite para começar a cadastrar pacientes.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {invites.map((inv) => (
            <Card key={inv.id} className="flex items-center justify-between gap-4 border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {inv.patient_name || <span className="text-muted-foreground">Sem nome</span>}
                  </p>
                  {renderStatus(inv)}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  Token: <code className="font-mono">{inv.token.slice(0, 12)}…</code>
                  {" · "}Criado em {new Date(inv.created_at).toLocaleDateString("pt-BR")}
                  {inv.notes && <> · {inv.notes}</>}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!inv.redeemed_at && !inv.revoked_at && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" />Copiar link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRevoke(inv.id)}
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Ban className="h-3.5 w-3.5" />Revogar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitesManager;
