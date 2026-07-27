/**
 * useUserRole — Hook para verificar a role (papel) do usuário logado.
 * Suporta: patient, hospital_admin, homecare_admin.
 * Quando hospital_admin: também busca o hospital_id vinculado.
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [homecareCompanyId, setHomecareCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setHospitalId(null);
      setHomecareCompanyId(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userRole = data?.role ?? "patient";
      setRole(userRole);

      if (userRole === "hospital_admin") {
        const { data: hospital } = await supabase
          .from("hospitals")
          .select("id")
          .eq("admin_user_id", user.id)
          .maybeSingle();

        if (hospital?.id) {
          setHospitalId(hospital.id);
        } else {
          // Fallback: admin vinculado via profiles.hospital_id (mesma fonte usada em /admin/videos)
          const { data: profile } = await supabase
            .from("profiles")
            .select("hospital_id")
            .eq("user_id", user.id)
            .maybeSingle();
          setHospitalId(profile?.hospital_id ?? null);
        }
      } else if (userRole === "homecare_admin") {
        const { data: company } = await supabase
          .from("homecare_companies")
          .select("id")
          .eq("admin_user_id", user.id)
          .maybeSingle();
        setHomecareCompanyId(company?.id ?? null);
      }

      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return {
    role,
    hospitalId,
    homecareCompanyId,
    loading,
    isAdmin: role === "hospital_admin",
    isHomecare: role === "homecare_admin",
  };
};
