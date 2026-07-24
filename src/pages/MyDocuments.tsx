/**
 * MyDocuments — "Meus Documentos" do paciente.
 * Exibe um resumo clínico personalizado (alta, terapias, hospital, home care)
 * que pode ser impresso ou salvo como PDF pelo próprio paciente.
 * Também lista atalhos para as orientações e checklists da(s) terapia(s) atribuída(s).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, FileText, ClipboardList, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TherapyInfo {
  slug: string;
  name: string;
}

interface DocData {
  nome: string;
  hospital_origem: string;
  therapies: TherapyInfo[];
  homecare: string | null;
  createdAt: string | null;
}

const MyDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DocData | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: therapies }, { data: hc }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nome, hospital_origem, created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("patient_therapies")
          .select("module:therapy_modules(slug, name)")
          .eq("patient_id", user.id),
        supabase
          .from("patient_homecare")
          .select("company:homecare_companies(name)")
          .eq("patient_id", user.id)
          .maybeSingle(),
      ]);

      setData({
        nome: profile?.nome ?? "Paciente",
        hospital_origem: profile?.hospital_origem ?? "—",
        createdAt: profile?.created_at ?? null,
        therapies: (therapies ?? [])
          .map((r: any) => r.module)
          .filter(Boolean) as TherapyInfo[],
        homecare: (hc as any)?.company?.name ?? null,
      });
      setLoading(false);
    })();
  }, [user]);

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Cabeçalho (oculto na impressão) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/perfil")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Button size="sm" onClick={() => window.print()} disabled={loading}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {/* Resumo clínico imprimível */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm print:shadow-none print:border-0">
            <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Resumo de Alta</h1>
                <p className="text-xs text-muted-foreground">
                  ProAlta · Emitido em {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <Row label="Paciente" value={data.nome} />
              <Row label="Hospital de origem" value={data.hospital_origem} />
              {data.homecare && <Row label="Empresa Home Care" value={data.homecare} />}
              <Row label="Data de cadastro" value={formatDate(data.createdAt)} />
              <div>
                <dt className="text-muted-foreground">Terapias acompanhadas</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {data.therapies.length === 0 ? (
                    <span className="text-foreground">Nenhuma terapia atribuída</span>
                  ) : (
                    data.therapies.map((t) => (
                      <span
                        key={t.slug}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary print:border print:border-border print:bg-transparent"
                      >
                        {t.name}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              Este documento é um resumo informativo do seu acompanhamento no ProAlta. Em caso
              de dúvidas clínicas, entre em contato com a equipe do hospital ou home care
              responsável.
            </p>
          </div>

          {/* Atalhos (não imprimem) */}
          <div className="mt-6 flex flex-col gap-2 print:hidden">
            <ShortcutButton
              icon={BookOpen}
              label="Orientações"
              description="Guias completos da sua terapia"
              onClick={() => navigate("/orientacoes")}
            />
            <ShortcutButton
              icon={ClipboardList}
              label="Checklist diário"
              description="Passo a passo dos cuidados"
              onClick={() => navigate("/checklist")}
            />
          </div>
        </>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium text-foreground">{value}</dd>
  </div>
);

const ShortcutButton = ({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/20 hover:shadow-sm active:scale-[0.98]"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </button>
);

export default MyDocuments;
