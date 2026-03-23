import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, PlayCircle, MessageCircle, User, MessagesSquare } from "lucide-react";

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
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
