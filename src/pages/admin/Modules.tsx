/**
 * Modules — Tela do admin hospitalar para habilitar/desabilitar módulos clínicos
 * e para cadastrar, editar e remover os próprios módulos (terapias).
 */

import { useState } from "react";
import { Check, Package, Plus, Pencil, Trash2, X } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useHospitalModules, type TherapyModule } from "@/hooks/useHospitalModules";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ModuleForm {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  is_active: boolean;
}

const emptyForm: ModuleForm = {
  slug: "",
  name: "",
  description: "",
  emoji: "📦",
  is_active: true,
};

/** Gera slug a partir do nome (sem acentos, minúsculo, hifenizado) */
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const Modules = () => {
  const { hospitalId } = useUserRole();
  const { user } = useAuth();
  const { allModules, enabled, loading, refetch } = useHospitalModules(hospitalId);
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TherapyModule | null>(null);
  const [form, setForm] = useState<ModuleForm>(emptyForm);

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

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (mod: TherapyModule) => {
    setEditing(mod);
    setForm({
      slug: mod.slug,
      name: mod.name,
      description: mod.description ?? "",
      emoji: mod.emoji ?? "📦",
      is_active: mod.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Informe o nome do módulo");
      return;
    }
    const slug = slugify(form.slug || name);
    if (!slug) {
      toast.error("Não foi possível gerar o identificador (slug) do módulo");
      return;
    }

    const payload = {
      slug,
      name,
      description: form.description.trim() || null,
      emoji: form.emoji || null,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase
        .from("therapy_modules")
        .update(payload)
        .eq("id", editing.id);
      if (error) return toast.error("Erro ao salvar: " + error.message);
      toast.success("Módulo atualizado");
    } else {
      const { error } = await supabase.from("therapy_modules").insert(payload);
      if (error) return toast.error("Erro ao criar: " + error.message);
      toast.success("Módulo cadastrado");
    }
    closeForm();
    await refetch();
  };

  const remove = async (mod: TherapyModule) => {
    if (
      !confirm(
        `Excluir o módulo "${mod.name}"? Ele deixará de aparecer para hospitais e pacientes.`,
      )
    )
      return;
    setBusy(mod.id);
    const { error } = await supabase.from("therapy_modules").delete().eq("id", mod.id);
    if (error) {
      toast.error(
        "Não foi possível excluir (o módulo pode estar em uso). Desative-o na edição.",
      );
    } else {
      toast.success("Módulo excluído");
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Módulos clínicos</h1>
          </div>
          <p className="text-muted-foreground">
            Habilite os módulos contratados pelo seu hospital. Pacientes verão apenas conteúdo
            das terapias ativas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo módulo
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {allModules.map((mod) => {
          const isOn = enabledIds.has(mod.id);
          return (
            <div
              key={mod.id}
              className={`flex items-start gap-4 rounded-xl border p-5 transition-all ${
                isOn ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
              } ${busy === mod.id ? "opacity-50" : ""}`}
            >
              <button
                onClick={() => toggle(mod.id)}
                disabled={busy === mod.id}
                className="flex flex-1 items-start gap-4 text-left"
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
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => openEdit(mod)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Editar módulo"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(mod)}
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                  title="Excluir módulo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {allModules.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            Nenhum módulo cadastrado ainda. Clique em "Novo módulo" para criar o primeiro.
          </p>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={closeForm}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeForm}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 text-lg font-bold text-foreground">
              {editing ? "Editar módulo" : "Novo módulo"}
            </h2>

            <div className="space-y-4">
              <Field label="Nome *">
                <input
                  className="mod-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ostomia"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Identificador (slug)" hint="Deixe vazio para gerar pelo nome.">
                  <input
                    className="mod-input"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={slugify(form.name) || "ostomia"}
                  />
                </Field>
                <Field label="Emoji">
                  <input
                    className="mod-input"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Descrição">
                <textarea
                  className="mod-input min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Módulo disponível para hospitais
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    <style>{`.mod-input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: hsl(var(--foreground)); }`}</style>
  </div>
);

export default Modules;
