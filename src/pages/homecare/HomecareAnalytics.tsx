/**
 * HomecareAnalytics — Versão do painel de analytics para empresas de Home Care.
 * Reusa as mesmas métricas (acesso, vídeos, dúvidas) mas filtrando pelos pacientes da empresa.
 */

import { useEffect, useState } from "react";
import { Activity, Video, HelpCircle, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useHomecareCompany } from "@/hooks/useHomecareCompany";

interface AccessRate { window: number; active: number; total: number; percent: number; }

const STOPWORDS = new Set([
  "a","o","as","os","um","uma","de","do","da","dos","das","e","ou","que","se","para","por","com",
  "sem","no","na","nos","nas","em","ao","à","às","aos","é","são","foi","ser","estar","está","tem",
  "ter","como","qual","quais","quando","meu","minha","seu","sua","isso","esse","essa","este","esta",
  "muito","mais","também","já","não","sim","pode","posso",
]);

const HomecareAnalytics = () => {
  const { companyId } = useHomecareCompany();
  const [loading, setLoading] = useState(true);
  const [accessRates, setAccessRates] = useState<AccessRate[]>([]);
  const [topVideos, setTopVideos] = useState<{ video_title: string; views: number }[]>([]);
  const [topQuestions, setTopQuestions] = useState<{ keyword: string; count: number }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      const { data: links } = await supabase
        .from("patient_homecare")
        .select("patient_id")
        .eq("company_id", companyId);
      const patientIds = (links ?? []).map((l) => l.patient_id);
      const total = patientIds.length;

      if (!total) {
        setAccessRates([7, 15, 30].map((w) => ({ window: w, active: 0, total: 0, percent: 0 })));
        setLoading(false);
        return;
      }

      const [accessRes, videosRes, questionsRes] = await Promise.all([
        supabase.from("access_logs").select("patient_id, created_at").in("patient_id", patientIds),
        supabase.from("video_views").select("video_title").in("patient_id", patientIds),
        supabase.from("questions").select("content").in("patient_id", patientIds),
      ]);

      const logs = accessRes.data ?? [];
      const now = Date.now();
      const rate = (days: number): AccessRate => {
        const cutoff = now - days * 86400000;
        const active = new Set(
          logs.filter((l) => new Date(l.created_at).getTime() >= cutoff).map((l) => l.patient_id)
        ).size;
        return { window: days, active, total, percent: total ? Math.round((active / total) * 100) : 0 };
      };
      setAccessRates([rate(7), rate(15), rate(30)]);

      const videoCounts = new Map<string, number>();
      (videosRes.data ?? []).forEach((v) =>
        videoCounts.set(v.video_title, (videoCounts.get(v.video_title) ?? 0) + 1)
      );
      setTopVideos(
        Array.from(videoCounts.entries())
          .map(([video_title, views]) => ({ video_title, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 6)
      );

      const counts = new Map<string, number>();
      (questionsRes.data ?? []).forEach((q) => {
        const words = q.content
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
        new Set(words).forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
      });
      setTopQuestions(
        Array.from(counts.entries())
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      );

      setLoading(false);
    };
    fetch();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Home Care</h1>
        <p className="text-muted-foreground">Engajamento dos pacientes da sua empresa</p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Taxa de acesso</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {accessRates.map((r) => (
            <div key={r.window} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Últimos {r.window} dias</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{r.percent}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.active} de {r.total} pacientes ativos
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${r.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Vídeos mais assistidos</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {topVideos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem visualizações ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topVideos} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="video_title" stroke="hsl(var(--muted-foreground))" fontSize={12} width={140} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Dúvidas mais frequentes</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {topQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dúvidas registradas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topQuestions.map((q) => {
                const max = topQuestions[0].count;
                const scale = 0.85 + (q.count / max) * 0.6;
                return (
                  <span key={q.keyword} className="rounded-full bg-primary/10 px-4 py-2 font-medium text-primary" style={{ fontSize: `${scale}rem` }}>
                    {q.keyword}
                    <span className="ml-2 text-xs text-primary/70">{q.count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomecareAnalytics;
