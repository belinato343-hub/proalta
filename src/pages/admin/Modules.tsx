/**
 * Modules — Tela do admin hospitalar para habilitar/desabilitar módulos clínicos.
 * Cada hospital escolhe quais terapias (Nutrição Enteral, Ostomia, etc) estão ativas.
 */

import { useState } from "react";
import { Check, Package } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useHospitalModules } from "@/hooks/useHospitalModules";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const Modules = () => {
  const { hospitalId } = useUserRole();
  const { user } = useAuth();
  const { allModules, enabled, loading, refetch } = useHospitalModules(hospitalId);
  const [busy, setBusy] = useState<string | null>(null);

  const enabledIds = new Set(enabled.map((e) => e.module_id));

  const toggle = async (moduleId: string) => {
    if (!hospitalId || !user) return;
    setBusy(moduleId);
    if (enabledIds.has(moduleId)) {
      const link = enabled.find((e) => e.module_id === moduleId);
      const { error } = await supabase
        .from("hospital_modules")
        .delete()
        .eq("id", link!.id);
      if (error) toast.error("Erro ao desabilitar módulo");
      else toast.success("Módulo desabilitado");
    } else {
      const { error } = await supabase.from("hospital_modules").insert({
        hospital_id: hospitalId,
        module_id: moduleId,
        enabled_by: user.id,
      });
      if (error) toast.error("Erro ao habilitar módulo");
      else toast.success("Módulo habilitado");
    }
    await refetch();
    setBusy(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Módulos clínicos</h1>
      </div>
      <p className="mb-6 text-muted-foreground">
        Habilite os módulos contratados pelo seu hospital. Pacientes verão apenas conteúdo das terapias ativas.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {allModules.map((mod) => {
          const isOn = enabledIds.has(mod.id);
          return (
            <button
              key={mod.id}
              onClick={() => toggle(mod.id)}
              disabled={busy === mod.id}
              className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                isOn
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              } ${busy === mod.id ? "opacity-50" : ""}`}
            >
              <span className="text-3xl">{mod.emoji ?? "📦"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{mod.name}</h3>
                  {isOn && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Check className="h-3 w-3" /> Ativo
                    </span>
                  )}
                </div>
                {mod.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Modules;
