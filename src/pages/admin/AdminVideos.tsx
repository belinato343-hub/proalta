/**
 * AdminVideos — CRUD de vídeos educativos para admins de hospital.
 * Vídeos globais (hospital_id NULL) são exibidos como somente-leitura.
 * Vídeos criados pelo hospital atual podem ser editados/excluídos.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHospitalModules } from "@/hooks/useHospitalModules";
import { toast } from "@/components/ui/sonner";
import { Plus, Pencil, Trash2, X, ExternalLink, Lock } from "lucide-react";
import { detectProvider, getAutoThumbnail } from "@/lib/videoEmbed";

interface VideoRow {
  id: string;
  hospital_id: string | null;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  emoji: string | null;
  duration_seconds: number;
  module_slugs: string[];
  is_active: boolean;
  sort_order: number;
}

const emptyForm: Omit<VideoRow, "id" | "hospital_id"> = {
  title: "",
  description: "",
  category: "Geral",
  video_url: "",
  thumbnail_url: "",
  emoji: "🎬",
  duration_seconds: 0,
  module_slugs: [],
  is_active: true,
  sort_order: 0,
};

const AdminVideos = () => {
  const { user } = useAuth();
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const { allModules } = useHospitalModules(hospitalId);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Descobre hospital_id do admin logado
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("hospital_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setHospitalId(data?.hospital_id ?? null));
  }, [user]);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) toast.error("Erro ao carregar vídeos");
    setVideos((data ?? []) as VideoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (v: VideoRow) => {
    setEditing(v);
    setForm({
      title: v.title,
      description: v.description ?? "",
      category: v.category,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url ?? "",
      emoji: v.emoji ?? "🎬",
      duration_seconds: v.duration_seconds,
      module_slugs: v.module_slugs,
      is_active: v.is_active,
      sort_order: v.sort_order,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const toggleModule = (slug: string) => {
    setForm((f) => ({
      ...f,
      module_slugs: f.module_slugs.includes(slug)
        ? f.module_slugs.filter((s) => s !== slug)
        : [...f.module_slugs, slug],
    }));
  };

  const save = async () => {
    if (!editing && !hospitalId) {
      toast.error("Hospital não identificado");
      return;
    }
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error("Título e URL do vídeo são obrigatórios");
      return;
    }

    const payload = {
      ...form,
      description: form.description || null,
      thumbnail_url: form.thumbnail_url || null,
      emoji: form.emoji || null,
      // Vídeos globais permanecem globais ao serem editados
      hospital_id: editing ? editing.hospital_id : hospitalId,
    };

    if (editing) {
      const { error } = await supabase.from("videos").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao salvar: " + error.message);
      toast.success("Vídeo atualizado");
    } else {
      const { error } = await supabase.from("videos").insert(payload);
      if (error) return toast.error("Erro ao criar: " + error.message);
      toast.success("Vídeo cadastrado");
    }
    closeForm();
    fetchVideos();
  };

  const remove = async (v: VideoRow) => {
    if (!confirm(`Excluir o vídeo "${v.title}"?`)) return;
    const { error } = await supabase.from("videos").delete().eq("id", v.id);
    if (error) return toast.error("Erro ao excluir: " + error.message);
    toast.success("Vídeo excluído");
    fetchVideos();
  };

  const myVideos = videos.filter((v) => v.hospital_id === hospitalId);
  const globalVideos = videos.filter((v) => v.hospital_id === null);

  return (
    <div className="max-w-5xl">
      {!loading && !hospitalId && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Seu usuário administrador não está vinculado a nenhum hospital. Enquanto isso, o cadastro
          e a edição de vídeos ficam bloqueados.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vídeos Educativos</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre vídeos do YouTube ou Vimeo para os pacientes do seu hospital.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo vídeo
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-8">
          <VideoSection
            title="Vídeos do meu hospital"
            empty="Você ainda não cadastrou nenhum vídeo."
            videos={myVideos}
            editable
            onEdit={openEdit}
            onDelete={remove}
          />
          <VideoSection
            title="Vídeos globais (ProAlta)"
            empty=""
            videos={globalVideos}
            editable
            onEdit={openEdit}
            onDelete={remove}
          />

        </div>
      )}

      {showForm && (
        <VideoFormModal
          editing={!!editing}
          form={form}
          setForm={setForm}
          allModules={allModules}
          toggleModule={toggleModule}
          onClose={closeForm}
          onSave={save}
        />
      )}
    </div>
  );
};

/** Lista de vídeos em cards horizontais */
const VideoSection = ({
  title,
  empty,
  videos,
  editable,
  onEdit,
  onDelete,
}: {
  title: string;
  empty: string;
  videos: VideoRow[];
  editable: boolean;
  onEdit?: (v: VideoRow) => void;
  onDelete?: (v: VideoRow) => void;
}) => (
  <section>
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {title} · {videos.length}
    </h2>
    {videos.length === 0 && empty && (
      <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
        {empty}
      </p>
    )}
    <div className="space-y-2">
      {videos.map((v) => {
        const thumb = v.thumbnail_url || getAutoThumbnail(v.video_url);
        return (
          <div
            key={v.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-md bg-primary/5">
              {thumb ? (
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">{v.emoji ?? "🎬"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{v.title}</p>
                {!v.is_active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    inativo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {v.category}
                {v.module_slugs.length > 0 && ` · ${v.module_slugs.join(", ")}`}
              </p>
            </div>
            <a
              href={v.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Abrir URL"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {editable ? (
              <>
                <button
                  onClick={() => onEdit?.(v)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete?.(v)}
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="p-2 text-muted-foreground" title="Somente leitura">
                <Lock className="h-4 w-4" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  </section>
);

/** Modal de formulário criar/editar vídeo */
const VideoFormModal = ({
  editing,
  form,
  setForm,
  allModules,
  toggleModule,
  onClose,
  onSave,
}: {
  editing: boolean;
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  allModules: { slug: string; name: string }[];
  toggleModule: (slug: string) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const provider = detectProvider(form.video_url);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-lg font-bold text-foreground">
          {editing ? "Editar vídeo" : "Novo vídeo"}
        </h2>

        <div className="space-y-4">
          <Field label="Título *">
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Higiene da Sonda"
            />
          </Field>

          <Field
            label="URL do vídeo (YouTube ou Vimeo) *"
            hint={
              form.video_url && provider === "unknown"
                ? "URL não reconhecida — use um link do YouTube ou Vimeo."
                : provider !== "unknown"
                ? `Provedor detectado: ${provider}`
                : undefined
            }
          >
            <input
              className="input"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Cuidados Básicos"
              />
            </Field>
            <Field label="Duração (segundos)">
              <input
                type="number"
                className="input"
                value={form.duration_seconds}
                onChange={(e) =>
                  setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              className="input min-h-[80px]"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Emoji (fallback)">
              <input
                className="input"
                value={form.emoji ?? ""}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </Field>
            <Field label="Ordem">
              <input
                type="number"
                className="input"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Ativo">
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Exibir para pacientes
              </label>
            </Field>
          </div>

          <Field
            label="Módulos clínicos"
            hint="Se nenhum for marcado, o vídeo aparece para todos os pacientes."
          >
            <div className="flex flex-wrap gap-2">
              {allModules.map((m) => {
                const active = form.module_slugs.includes(m.slug);
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => toggleModule(m.slug)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
              {allModules.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum módulo disponível — habilite em /admin/modulos.
                </p>
              )}
            </div>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Salvar
          </button>
        </div>
      </div>
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
    <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: hsl(var(--foreground)); }`}</style>
  </div>
);

export default AdminVideos;
