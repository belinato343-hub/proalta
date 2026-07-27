/**
 * VideoLibrary — Biblioteca de vídeos educativos.
 * Consome a tabela `videos` (globais + do hospital do paciente), filtra por terapias
 * atribuídas (usePatientTherapies) e reproduz via iframe do YouTube/Vimeo.
 */

import { useEffect, useState } from "react";
import { PlayCircle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePatientTherapies } from "@/hooks/usePatientTherapies";
import { getEmbedUrl, getAutoThumbnail } from "@/lib/videoEmbed";

interface Video {
  id: string;
  hospital_id: string | null;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  emoji: string | null;
  duration_seconds: number;
  modules: string[]; // slugs — nome usado pelo filtro do usePatientTherapies
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VideoLibrary = () => {
  const { user } = useAuth();
  const { filter } = usePatientTherapies();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    supabase
      .from("videos")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const mapped: Video[] = (data ?? []).map((v: any) => ({
          id: v.id,
          hospital_id: v.hospital_id,
          title: v.title,
          description: v.description,
          category: v.category,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url,
          emoji: v.emoji,
          duration_seconds: v.duration_seconds,
          modules: v.module_slugs ?? [],
        }));
        setVideos(mapped);
        setLoading(false);
      });
  }, []);

  const visibleVideos = filter(videos);

  /** Registra a visualização quando o paciente abre o vídeo. */
  const trackView = async (video: Video) => {
    if (!user) return;
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
      watched_seconds: video.duration_seconds,
      completion_percent: 100,
    });
  };

  const handleOpen = (video: Video) => {
    setActiveVideo(video);
    trackView(video);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Biblioteca de Vídeos</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">
        Vídeos educativos sobre seus cuidados
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : visibleVideos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {videos.length > 0
            ? "Nenhum vídeo corresponde às terapias atribuídas ao seu perfil. Fale com a equipe do hospital para revisar suas terapias."
            : "Nenhum vídeo disponível ainda."}
        </p>

      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visibleVideos.map((video, index) => {
            const thumb = video.thumbnail_url || getAutoThumbnail(video.video_url);
            return (
              <button
                key={video.id}
                onClick={() => handleOpen(video)}
                className="animate-slide-up group flex flex-col rounded-xl bg-card border border-border shadow-sm overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="relative flex h-28 items-center justify-center overflow-hidden bg-primary/5">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl">{video.emoji ?? "🎬"}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                    <PlayCircle className="h-10 w-10 text-white opacity-90 drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-primary mb-1">{video.category}</p>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{video.title}</h3>
                  {video.duration_seconds > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{formatDuration(video.duration_seconds)}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Player em modal com iframe do YouTube/Vimeo */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-card/80 p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            {(() => {
              const embed = getEmbedUrl(activeVideo.video_url);
              if (embed) {
                return (
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                    <iframe
                      src={embed}
                      title={activeVideo.title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-primary/5">
                  <div className="text-center">
                    <span className="block text-7xl">{activeVideo.emoji ?? "🎬"}</span>
                    <a
                      href={activeVideo.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm font-medium text-primary underline"
                    >
                      Abrir vídeo
                    </a>
                  </div>
                </div>
              );
            })()}
            <div className="p-2 pt-4">
              <p className="text-xs font-medium text-primary mb-1">{activeVideo.category}</p>
              <h2 className="text-lg font-bold text-foreground">{activeVideo.title}</h2>
              {activeVideo.description && (
                <p className="mt-2 text-sm text-muted-foreground">{activeVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
