import { PlayCircle, Clock } from "lucide-react";

const videos = [
  { title: "Higiene da Sonda", duration: "3:20", category: "Cuidados Básicos", thumbnail: "🧼" },
  { title: "Preparo da Dieta Enteral", duration: "4:15", category: "Alimentação", thumbnail: "🥣" },
  { title: "Posicionamento do Paciente", duration: "2:45", category: "Posição", thumbnail: "🛏️" },
  { title: "Limpeza de Materiais", duration: "3:00", category: "Higiene", thumbnail: "✨" },
  { title: "Administração da Dieta", duration: "5:10", category: "Alimentação", thumbnail: "💧" },
  { title: "Prevenção de Complicações", duration: "4:30", category: "Segurança", thumbnail: "🛡️" },
  { title: "Cuidados com Gastrostomia", duration: "3:50", category: "Sonda", thumbnail: "🩺" },
  { title: "Sinais de Alerta", duration: "2:30", category: "Segurança", thumbnail: "⚠️" },
];

const VideoLibrary = () => {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Biblioteca de Vídeos</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">Vídeos educativos sobre cuidados com a sonda</p>

      <div className="grid grid-cols-2 gap-3">
        {videos.map((video, index) => (
          <button
            key={video.title}
            className="animate-slide-up group flex flex-col rounded-xl bg-card border border-border shadow-sm overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {/* Thumbnail */}
            <div className="relative flex h-28 items-center justify-center bg-primary/5">
              <span className="text-4xl">{video.thumbnail}</span>
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/5">
                <PlayCircle className="h-10 w-10 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {/* Info */}
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
    </div>
  );
};

export default VideoLibrary;
