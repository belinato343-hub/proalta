/**
 * usePatientTherapies — Retorna os slugs dos módulos clínicos atribuídos ao paciente logado.
 * Usado para filtrar conteúdo (vídeos, orientações, checklist) por terapia.
 * Se o paciente não tem nenhuma terapia atribuída, retorna hasAny=false —
 * nesse caso as páginas exibem todo o conteúdo como fallback (compatibilidade).
 */

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const usePatientTherapies = () => {
  const { user } = useAuth();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSlugs(new Set());
      setLoading(false);
      return;
    }
    supabase
      .from("patient_therapies")
      .select("module:therapy_modules(slug)")
      .eq("patient_id", user.id)
      .then(({ data }) => {
        const s = new Set<string>();
        (data ?? []).forEach((row: any) => {
          if (row?.module?.slug) s.add(row.module.slug);
        });
        setSlugs(s);
        setLoading(false);
      });
  }, [user]);

  /** True se o paciente tem ao menos uma terapia atribuída. */
  const hasAny = slugs.size > 0;

  /**
   * Filtra uma lista de itens que declaram `modules: string[]` (slugs).
   * Regra: se paciente não tem terapias, mostra tudo (fallback).
   * Caso contrário, mostra itens cujo módulo intersecta com os atribuídos,
   * ou itens sem `modules` declarado (conteúdo geral).
   */
  const filter = <T extends { modules?: string[] }>(items: T[]): T[] => {
    if (!hasAny) return items;
    return items.filter(
      (i) => !i.modules || i.modules.length === 0 || i.modules.some((m) => slugs.has(m))
    );
  };

  return { slugs, hasAny, loading, filter };
};
