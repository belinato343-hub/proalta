/**
 * useHospitalModules — Lista os módulos clínicos habilitados pelo hospital do admin logado.
 * Usado para popular telas de habilitação de módulos e filtros de conteúdo.
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TherapyModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  emoji: string | null;
  is_active: boolean;
}

export interface HospitalModule {
  id: string;
  module_id: string;
  module: TherapyModule;
}

export const useHospitalModules = (hospitalId: string | null) => {
  const [allModules, setAllModules] = useState<TherapyModule[]>([]);
  const [enabled, setEnabled] = useState<HospitalModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: modules }, { data: hm }] = await Promise.all([
      supabase
        .from("therapy_modules")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("hospital_modules")
        .select("id, module_id, module:therapy_modules(*)")
        .eq("hospital_id", hospitalId),
    ]);
    setAllModules(modules ?? []);
    setEnabled((hm ?? []) as HospitalModule[]);
    setLoading(false);
  }, [hospitalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { allModules, enabled, loading, refetch: fetchData };
};
