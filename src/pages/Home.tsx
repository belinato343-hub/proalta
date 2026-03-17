import { useNavigate } from "react-router-dom";
import { PlayCircle, ClipboardCheck, BookOpen, MessageCircle, AlertTriangle } from "lucide-react";

const actionCards = [
  {
    title: "Assistir Vídeos",
    description: "Vídeos educativos sobre cuidados com a sonda",
    icon: PlayCircle,
    path: "/biblioteca",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Checklist Diário",
    description: "Verifique os cuidados do dia",
    icon: ClipboardCheck,
    path: "/checklist",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Orientações",
    description: "Passo a passo para cada tipo de sonda",
    icon: BookOpen,
    path: "/orientacoes",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Enviar Dúvida",
    description: "Tire suas dúvidas com a equipe",
    icon: MessageCircle,
    path: "/duvidas",
    color: "bg-primary text-primary-foreground",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ProAlta</h1>
            <p className="text-sm text-muted-foreground">Orientação Nutricional</p>
          </div>
        </div>
      </div>

      {/* Welcome */}
      <div className="mb-6 animate-slide-up rounded-xl bg-card p-5 shadow-sm border border-border">
        <p className="text-base font-medium text-foreground">
          Olá! 👋
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui você encontra todas as orientações para o cuidado seguro com a sonda e a dieta enteral em casa.
        </p>
      </div>

      {/* Alert Card */}
      <div className="mb-6 animate-slide-up rounded-xl border border-accent/30 bg-accent/10 p-4 flex items-start gap-3" style={{ animationDelay: "0.1s" }}>
        <AlertTriangle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Atenção</p>
          <p className="text-sm text-muted-foreground">
            Em caso de febre, vômito ou saída acidental da sonda, procure atendimento médico imediatamente.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        {actionCards.map((card, index) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="animate-slide-up flex flex-col items-start rounded-xl bg-card p-5 shadow-sm border border-border text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
            style={{ animationDelay: `${0.15 + index * 0.08}s` }}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <card.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-8 mb-4 text-center text-xs text-muted-foreground">
        Conteúdo validado por nutricionistas especializados
      </p>
    </div>
  );
};

export default Home;
