/**
 * useHomecareCompany — Retorna a empresa de Home Care vinculada ao admin logado.
 */

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useHomecareCompany = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("homecare_companies")
      .select("id, name")
      .eq("admin_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCompanyId(data?.id ?? null);
        setCompanyName(data?.name ?? null);
        setLoading(false);
      });
  }, [user]);

  return { companyId, companyName, loading };
};
