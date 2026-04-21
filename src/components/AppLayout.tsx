/**
 * AppLayout — Layout principal do app para pacientes.
 * Inclui a barra de navegação inferior (tab bar) estilo mobile
 * com links para Início, Biblioteca, Chat, Dúvidas e Perfil.
 */

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, User, MessagesSquare } from "lucide-react";
import { useTrackAccess } from "@/hooks/useTrackAccess";

/** Definição das abas da barra de navegação inferior */
const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/biblioteca", icon: PlayCircle, label: "Biblioteca" },
  { path: "/chat", icon: MessagesSquare, label: "Chat" },
  { path: "/duvidas", icon: MessageCircle, label: "Dúvidas" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Registra acesso do paciente automaticamente ao entrar no app
  useTrackAccess();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Área de conteúdo principal — renderiza a rota filha */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Barra de navegação inferior fixa (tab bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
