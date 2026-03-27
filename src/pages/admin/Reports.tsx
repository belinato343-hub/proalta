/**
 * Reports — Relatórios detalhados dos pacientes vinculados ao hospital.
 * Exibe uma tabela completa com nome, tipo de sonda, hospital de origem,
 * data de cadastro e permite exportação e busca.
 */

import { useEffect, useState } from "react";
import { Search, FileText, Download, User, Calendar, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Tipagem dos dados do paciente no relatório */
interface PatientReport {
  id: string;
  user_id: string;
  nome: string | null;
  tipo_sonda: string | null;
  hospital_origem: string | null;
  created_at: string;
  updated_at: string;
  /** Total de dúvidas enviadas pelo paciente */
  total_questions: number;
  /** Total de mensagens de chat do paciente */
  total_messages: number;
}

const Reports = () => {
  const { hospitalId } = useUserRole();
  const [patients, setPatients] = useState<PatientReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /** Busca pacientes e suas estatísticas ao montar o componente */
  useEffect(() => {
    if (!hospitalId) return;

    const fetchReports = async () => {
      // Busca perfis dos pacientes vinculados ao hospital
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, nome, tipo_sonda, hospital_origem, created_at, updated_at")
        .eq("hospital_id", hospitalId)
        .order("created_at", { ascending: false });

      if (!profiles || profiles.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      // Para cada paciente, busca contagem de dúvidas e mensagens em paralelo
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const [questionsRes, messagesRes] = await Promise.all([
            supabase
              .from("questions")
              .select("id", { count: "exact", head: true })
              .eq("patient_id", p.user_id),
            supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("patient_id", p.user_id),
          ]);

          return {
            ...p,
            total_questions: questionsRes.count ?? 0,
            total_messages: messagesRes.count ?? 0,
          };
        })
      );

      setPatients(enriched);
      setLoading(false);
    };

    fetchReports();
  }, [hospitalId]);

  /** Filtra pacientes pela busca (nome, sonda ou hospital de origem) */
  const filtered = patients.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.nome ?? "").toLowerCase().includes(term) ||
      (p.tipo_sonda ?? "").toLowerCase().includes(term) ||
      (p.hospital_origem ?? "").toLowerCase().includes(term)
    );
  });

  /** Exporta os dados dos pacientes em formato CSV */
  const handleExportCSV = () => {
    const headers = ["Nome", "Tipo de Sonda", "Hospital de Origem", "Data de Cadastro", "Dúvidas", "Mensagens"];
    const rows = filtered.map((p) => [
      p.nome ?? "Não informado",
      p.tipo_sonda ?? "Não informado",
      p.hospital_origem ?? "Não informado",
      format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR }),
      p.total_questions.toString(),
      p.total_messages.toString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-pacientes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** Formata data para exibição em pt-BR */
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div>
      {/* Cabeçalho com título e botão de exportação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Dados completos dos pacientes vinculados</p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="gap-2"
          disabled={filtered.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Resumo geral */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        {[
          { label: "Total Pacientes", value: patients.length, icon: User },
          { label: "Com Sonda Informada", value: patients.filter((p) => p.tipo_sonda).length, icon: Activity },
          { label: "Total Dúvidas", value: patients.reduce((s, p) => s + p.total_questions, 0), icon: FileText },
          { label: "Total Mensagens", value: patients.reduce((s, p) => s + p.total_messages, 0), icon: FileText },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Campo de busca */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, sonda ou hospital..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum paciente encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Tente outra busca" : "Ainda não há pacientes vinculados"}
          </p>
        </div>
      ) : (
        /* Tabela de relatórios */
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo de Sonda</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hospital de Origem</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cadastro</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Dúvidas</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Mensagens</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient, i) => (
                <tr
                  key={patient.id}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  {/* Nome do paciente com avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {patient.nome || "Não informado"}
                      </span>
                    </div>
                  </td>

                  {/* Tipo de sonda com badge */}
                  <td className="px-4 py-3">
                    {patient.tipo_sonda ? (
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {patient.tipo_sonda}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Hospital de origem */}
                  <td className="px-4 py-3 text-foreground">
                    {patient.hospital_origem || "—"}
                  </td>

                  {/* Data de cadastro */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(patient.created_at)}
                    </div>
                  </td>

                  {/* Total de dúvidas */}
                  <td className="px-4 py-3 text-center font-medium text-foreground">
                    {patient.total_questions}
                  </td>

                  {/* Total de mensagens */}
                  <td className="px-4 py-3 text-center font-medium text-foreground">
                    {patient.total_messages}
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

export default Reports;
