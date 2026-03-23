import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setHospitalId(null);
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
        setHospitalId(hospital?.id ?? null);
      }

      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, hospitalId, loading, isAdmin: role === "hospital_admin" };
};
