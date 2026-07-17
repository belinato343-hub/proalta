/**
 * VideoLibrary — Biblioteca de vídeos educativos sobre cuidados com a sonda.
 * Registra automaticamente a visualização (video_views) quando o paciente clica em um vídeo.
 * Os vídeos são mock (dados estáticos) — quando integrar player real, registrar tempo assistido também.
 */

import { useState } from "react";
import { PlayCircle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePatientTherapies } from "@/hooks/usePatientTherapies";

/** Dados mockados dos vídeos educativos. `id` é estável e usado para analytics.
 *  `modules` referencia slugs de therapy_modules — usado para filtrar por terapia do paciente. */
const videos = [
  { id: "higiene-sonda", title: "Higiene da Sonda", duration: "3:20", durationSeconds: 200, category: "Cuidados Básicos", thumbnail: "🧼", modules: ["nutricao-enteral"] },
  { id: "preparo-dieta", title: "Preparo da Dieta Enteral", duration: "4:15", durationSeconds: 255, category: "Alimentação", thumbnail: "🥣", modules: ["nutricao-enteral"] },
  { id: "posicionamento", title: "Posicionamento do Paciente", duration: "2:45", durationSeconds: 165, category: "Posição", thumbnail: "🛏️", modules: ["nutricao-enteral"] },
  { id: "limpeza-materiais", title: "Limpeza de Materiais", duration: "3:00", durationSeconds: 180, category: "Higiene", thumbnail: "✨", modules: ["nutricao-enteral", "ostomia", "traqueostomia", "curativos"] },
  { id: "administracao-dieta", title: "Administração da Dieta", duration: "5:10", durationSeconds: 310, category: "Alimentação", thumbnail: "💧", modules: ["nutricao-enteral"] },
  { id: "prevencao-complicacoes", title: "Prevenção de Complicações", duration: "4:30", durationSeconds: 270, category: "Segurança", thumbnail: "🛡️", modules: ["nutricao-enteral", "ostomia", "traqueostomia", "dialise", "curativos"] },
  { id: "cuidados-gastrostomia", title: "Cuidados com Gastrostomia", duration: "3:50", durationSeconds: 230, category: "Sonda", thumbnail: "🩺", modules: ["nutricao-enteral"] },
  { id: "sinais-alerta", title: "Sinais de Alerta", duration: "2:30", durationSeconds: 150, category: "Segurança", thumbnail: "⚠️", modules: ["nutricao-enteral", "ostomia", "traqueostomia", "dialise", "curativos"] },
  { id: "cuidados-ostomia", title: "Cuidados com Ostomia", duration: "3:40", durationSeconds: 220, category: "Ostomia", thumbnail: "🫁", modules: ["ostomia"] },
  { id: "troca-bolsa-ostomia", title: "Troca da Bolsa de Ostomia", duration: "4:00", durationSeconds: 240, category: "Ostomia", thumbnail: "👜", modules: ["ostomia"] },
  { id: "cuidados-traqueo", title: "Aspiração de Traqueostomia", duration: "3:20", durationSeconds: 200, category: "Traqueostomia", thumbnail: "🌬️", modules: ["traqueostomia"] },
  { id: "cuidados-dialise", title: "Cuidados com Cateter de Diálise", duration: "4:10", durationSeconds: 250, category: "Diálise", thumbnail: "💧", modules: ["dialise"] },
  { id: "troca-curativo", title: "Troca de Curativo", duration: "3:00", durationSeconds: 180, category: "Curativos", thumbnail: "🩹", modules: ["curativos"] },
];

const VideoLibrary = () => {
  const { user } = useAuth();
  const { filter } = usePatientTherapies();
  const visibleVideos = filter(videos);
  const [activeVideo, setActiveVideo] = useState<typeof videos[0] | null>(null);

  /**
   * Registra a visualização do vídeo na tabela video_views.
   * Como ainda não há player real, assumimos visualização total (100%) ao abrir.
   * Quando integrar player real, capturar progresso real do onTimeUpdate.
   */
  const trackView = async (video: typeof videos[0]) => {
    if (!user) return;

    // Busca hospital do paciente para vincular a métrica
    const { data: profile } = await supabase
      .from("profiles")
      .select("hospital_id")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("video_views").insert({
      patient_id: user.id,
      hospital_id: profile?.hospital_id ?? null,
      video_id: video.id,
      video_title: video.title,
      watched_seconds: video.durationSeconds,
      completion_percent: 100,
    });
  };

  const handleOpen = (video: typeof videos[0]) => {
    setActiveVideo(video);
    trackView(video);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Biblioteca de Vídeos</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">Vídeos educativos sobre cuidados com a sonda</p>

      {/* Grid de cards de vídeos */}
      <div className="grid grid-cols-2 gap-3">
        {visibleVideos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => handleOpen(video)}
            className="animate-slide-up group flex flex-col rounded-xl bg-card border border-border shadow-sm overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {/* Área de thumbnail com ícone de play */}
            <div className="relative flex h-28 items-center justify-center bg-primary/5">
              <span className="text-4xl">{video.thumbnail}</span>
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/5">
                <PlayCircle className="h-10 w-10 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {/* Informações do vídeo */}
            <div className="p-3">
              <p className="text-xs font-medium text-primary mb-1">{video.category}</p>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{video.title}</h3>
              <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{video.duration}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal simulando player de vídeo (placeholder até integração real) */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-primary/5 text-7xl">
              {activeVideo.thumbnail}
            </div>
            <p className="text-xs font-medium text-primary mb-1">{activeVideo.category}</p>
            <h2 className="text-lg font-bold text-foreground">{activeVideo.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Player de vídeo será integrado em breve. Sua visualização foi registrada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
