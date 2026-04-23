/**
 * useInvites — Hook para gerenciar convites de cadastro.
 * Funciona tanto para hospital quanto para home care (passa hospitalId OU companyId).
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Invite {
  id: string;
  token: string;
  hospital_id: string | null;
  company_id: string | null;
  module_id: string | null;
  patient_name: string | null;
  notes: string | null;
  created_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
}

interface Args {
  hospitalId?: string | null;
  companyId?: string | null;
}

export const useInvites = ({ hospitalId, companyId }: Args) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!hospitalId && !companyId) {
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const query = supabase
      .from("patient_invites")
      .select("*")
      .order("created_at", { ascending: false });

    const { data } = hospitalId
      ? await query.eq("hospital_id", hospitalId)
      : await query.eq("company_id", companyId!);

    setInvites((data ?? []) as Invite[]);
    setLoading(false);
  }, [hospitalId, companyId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const createInvite = async (params: { patient_name?: string; module_id?: string | null; notes?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Não autenticado" };

    const payload: any = {
      created_by: user.id,
      patient_name: params.patient_name || null,
      notes: params.notes || null,
    };
    if (hospitalId) {
      payload.hospital_id = hospitalId;
      payload.module_id = params.module_id || null;
    } else if (companyId) {
      payload.company_id = companyId;
    }

    const { error } = await supabase.from("patient_invites").insert(payload);
    if (!error) await fetchInvites();
    return { error };
  };

  const revokeInvite = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("patient_invites")
      .update({ revoked_at: new Date().toISOString(), revoked_by: user?.id })
      .eq("id", id);
    if (!error) await fetchInvites();
    return { error };
  };

  return { invites, loading, createInvite, revokeInvite, refetch: fetchInvites };
};
