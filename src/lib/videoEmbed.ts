/**
 * videoEmbed — utilitário para converter URLs de YouTube/Vimeo em URLs de embed.
 * Retorna null quando a URL não é reconhecida (aí o app usa o thumbnail/emoji como fallback).
 */

export type VideoProvider = "youtube" | "vimeo" | "unknown";

export const detectProvider = (url: string): VideoProvider => {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "unknown";
};

/** Extrai o ID do vídeo de uma URL do YouTube (formatos watch?v=, youtu.be/, embed/, shorts/). */
export const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/** Extrai o ID numérico de uma URL do Vimeo. */
export const getVimeoId = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

/** URL de embed pronta para iframe. Null se a URL não for reconhecida. */
export const getEmbedUrl = (url: string): string | null => {
  const provider = detectProvider(url);
  if (provider === "youtube") {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
  }
  if (provider === "vimeo") {
    const id = getVimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
};

/** Thumbnail automática (YouTube fornece; Vimeo exigiria API — retornamos null). */
export const getAutoThumbnail = (url: string): string | null => {
  const id = getYouTubeId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return null;
};
