/**
 * Analytics — Painel de Analytics para gestores hospitalares.
 *
 * Exibe métricas estratégicas:
 *  - Taxa de acesso pós-alta (7/15/30 dias)
 *  - Vídeos mais assistidos (ranking)
 *  - Dúvidas mais frequentes (clusterização por palavras-chave)
 *  - Correlação entre engajamento e reinternação
 *
 * Todas as consultas são filtradas pelo hospital_id do admin logado (multi-tenant).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  TrendingUp,
  Video,
  HelpCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

// ============================================================
// Tipos
// ============================================================

interface AccessRate {
  /** Janela em dias (7, 15, 30) */
  window: number;
  /** Pacientes ativos na janela */
  active: number;
  /** Total de pacientes do hospital */
  total: number;
  /** Percentual de acesso */
  percent: number;
}

interface VideoRanking {
  video_title: string;
  views: number;
}

interface QuestionCluster {
  keyword: string;
  count: number;
}

interface EngagementPoint {
  /** Nº total de acessos do paciente */
  accesses: number;
  /** 1 se reinternou, 0 caso contrário (usado como Y) */
  readmitted: number;
  /** Nome para o tooltip */
  name: string;
}

// ============================================================
// Helpers
// ============================================================

/** Stopwords PT-BR — filtra ruído ao clusterizar dúvidas */
const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "de", "do", "da", "dos", "das",
  "e", "ou", "que", "se", "para", "por", "com", "sem", "no", "na",
  "nos", "nas", "em", "ao", "à", "às", "aos", "é", "são", "foi", "ser",
  "estar", "está", "tem", "ter", "como", "qual", "quais", "quando",
  "meu", "minha", "seu", "sua", "isso", "esse", "essa", "este", "esta",
  "muito", "mais", "também", "já", "não", "sim", "pode", "posso",
]);

/** Extrai top palavras-chave das dúvidas (clusterização simples) */
const clusterQuestions = (contents: string[]): QuestionCluster[] => {
  const counts = new Map<string, number>();
  contents.forEach((text) => {
    const words = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    // Contagem única por dúvida (não inflar com repetições no mesmo texto)
    new Set(words).forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

// ============================================================
// Componente principal
// ============================================================

const Analytics = () => {
  const { hospitalId } = useUserRole();
  const [loading, setLoading] = useState(true);

  const [accessRates, setAccessRates] = useState<AccessRate[]>([]);
  const [topVideos, setTopVideos] = useState<VideoRanking[]>([]);
  const [topQuestions, setTopQuestions] = useState<QuestionCluster[]>([]);
  const [engagement, setEngagement] = useState<EngagementPoint[]>([]);
  const [readmissionRate, setReadmissionRate] = useState({ count: 0, total: 0 });

  useEffect(() => {
    if (!hospitalId) return;

    const fetchAll = async () => {
      // 1. Pacientes do hospital — base para taxa de acesso e correlação
      const { data: patients } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .eq("hospital_id", hospitalId);

      const patientIds = (patients ?? []).map((p) => p.user_id);
      const totalPatients = patientIds.length;

      // 2. Logs de acesso, vídeos, dúvidas e reinternações em paralelo
      const [accessRes, videosRes, questionsRes, readmissionsRes] = await Promise.all([
        supabase
          .from("access_logs")
          .select("patient_id, created_at")
          .eq("hospital_id", hospitalId),
        supabase
          .from("video_views")
          .select("video_title")
          .eq("hospital_id", hospitalId),
        supabase
          .from("questions")
          .select("content")
          .eq("hospital_id", hospitalId),
        supabase
          .from("readmissions")
          .select("patient_id")
          .eq("hospital_id", hospitalId),
      ]);

      const accessLogs = accessRes.data ?? [];
      const videoViews = videosRes.data ?? [];
      const questions = questionsRes.data ?? [];
      const readmissions = readmissionsRes.data ?? [];

      // === Taxa de acesso pós-alta (7/15/30 dias) ===
      const now = Date.now();
      const computeRate = (days: number): AccessRate => {
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        const activeSet = new Set(
          accessLogs
            .filter((l) => new Date(l.created_at).getTime() >= cutoff)
            .map((l) => l.patient_id)
        );
        const active = activeSet.size;
        return {
          window: days,
          active,
          total: totalPatients,
          percent: totalPatients ? Math.round((active / totalPatients) * 100) : 0,
        };
      };
      setAccessRates([computeRate(7), computeRate(15), computeRate(30)]);

      // === Top vídeos assistidos ===
      const videoCounts = new Map<string, number>();
      videoViews.forEach((v) => {
        videoCounts.set(v.video_title, (videoCounts.get(v.video_title) ?? 0) + 1);
      });
      setTopVideos(
        Array.from(videoCounts.entries())
          .map(([video_title, views]) => ({ video_title, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 6)
      );

      // === Top dúvidas frequentes (clusterização) ===
      setTopQuestions(clusterQuestions(questions.map((q) => q.content)));

      // === Correlação engajamento × reinternação ===
      const accessByPatient = new Map<string, number>();
      accessLogs.forEach((l) => {
        accessByPatient.set(l.patient_id, (accessByPatient.get(l.patient_id) ?? 0) + 1);
      });
      const readmittedSet = new Set(readmissions.map((r) => r.patient_id));
      const points: EngagementPoint[] = (patients ?? []).map((p) => ({
        name: p.nome ?? "Paciente",
        accesses: accessByPatient.get(p.user_id) ?? 0,
        readmitted: readmittedSet.has(p.user_id) ? 1 : 0,
      }));
      setEngagement(points);
      setReadmissionRate({ count: readmittedSet.size, total: totalPatients });

      setLoading(false);
    };

    fetchAll();
  }, [hospitalId]);

  // ============================================================
  // Métricas derivadas (memoizadas)
  // ============================================================
  const insights = useMemo(() => {
    if (engagement.length === 0) return null;
    const readmitted = engagement.filter((p) => p.readmitted === 1);
    const notReadmitted = engagement.filter((p) => p.readmitted === 0);
    const avg = (arr: EngagementPoint[]) =>
      arr.length ? arr.reduce((s, p) => s + p.accesses, 0) / arr.length : 0;
    return {
      avgAccessReadmitted: avg(readmitted).toFixed(1),
      avgAccessNotReadmitted: avg(notReadmitted).toFixed(1),
    };
  }, [engagement]);

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Visão estratégica do engajamento dos seus pacientes
        </p>
      </div>

      {/* === Taxa de acesso pós-alta === */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Taxa de acesso pós-alta
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {accessRates.map((r) => (
            <div
              key={r.window}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">Últimos {r.window} dias</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{r.percent}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.active} de {r.total} pacientes ativos
              </p>
              {/* Barra de progresso visual */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${r.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === Vídeos mais assistidos === */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Vídeos mais assistidos</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {topVideos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Ainda não há visualizações registradas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topVideos} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="video_title"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* === Dúvidas mais frequentes === */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Dúvidas mais frequentes
          </h2>
          <span className="text-xs text-muted-foreground">
            (palavras-chave extraídas)
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {topQuestions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Ainda não há dúvidas registradas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topQuestions.map((q, i) => {
                // Tamanho proporcional à frequência (cloud-style)
                const max = topQuestions[0].count;
                const scale = 0.85 + (q.count / max) * 0.6;
                return (
                  <span
                    key={q.keyword}
                    className="rounded-full bg-primary/10 px-4 py-2 font-medium text-primary"
                    style={{ fontSize: `${scale}rem` }}
                  >
                    {q.keyword}
                    <span className="ml-2 text-xs text-primary/70">{q.count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* === Correlação engajamento × reinternação === */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Engajamento × Reinternação
          </h2>
        </div>

        {/* Cards de insight */}
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Taxa de reinternação</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {readmissionRate.total
                ? Math.round((readmissionRate.count / readmissionRate.total) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">
              {readmissionRate.count} de {readmissionRate.total} pacientes
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Acessos médios — não reinternados
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {insights?.avgAccessNotReadmitted ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Acessos médios — reinternados
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {insights?.avgAccessReadmitted ?? "—"}
            </p>
          </div>
        </div>

        {/* Scatter plot: cada ponto é um paciente */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {engagement.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Sem dados suficientes para correlação.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    dataKey="accesses"
                    name="Acessos"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{
                      value: "Nº de acessos ao app",
                      position: "insideBottom",
                      offset: -15,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="readmitted"
                    name="Reinternou"
                    domain={[-0.2, 1.2]}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v === 1 ? "Sim" : v === 0 ? "Não" : "")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ZAxis range={[80, 80]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Reinternou") return [value === 1 ? "Sim" : "Não", name];
                      return [value, name];
                    }}
                  />
                  <Scatter data={engagement}>
                    {engagement.map((p, i) => (
                      <Cell
                        key={i}
                        fill={
                          p.readmitted === 1
                            ? "hsl(var(--destructive))"
                            : "hsl(var(--primary))"
                        }
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Cada ponto representa um paciente. Pacientes mais engajados (mais acessos)
                tendem a reinternar menos.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
