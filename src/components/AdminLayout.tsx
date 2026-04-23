/**
 * AdminLayout — Layout do painel administrativo para hospitais.
 * Inclui uma sidebar fixa à esquerda com navegação para
 * Dashboard, Pacientes, Dúvidas e Chat, além do botão de logout.
 */

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, MessageCircle, HelpCircle, LogOut, FileText, BarChart3, AlertTriangle, Package, Stethoscope, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

/** Itens do menu lateral do painel admin */
const sidebarItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/pacientes", icon: Users, label: "Pacientes" },
  { path: "/admin/convites", icon: Mail, label: "Convites" },
  { path: "/admin/modulos", icon: Package, label: "Módulos" },
  { path: "/admin/terapias", icon: Stethoscope, label: "Terapias" },
  { path: "/admin/duvidas", icon: HelpCircle, label: "Dúvidas" },
  { path: "/admin/chat", icon: MessageCircle, label: "Chat" },
  { path: "/admin/reinternacoes", icon: AlertTriangle, label: "Reinternações" },
  { path: "/admin/relatorios", icon: FileText, label: "Relatórios" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  /** Faz logout e redireciona para a tela de login */
  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — Menu lateral fixo */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        {/* Logo e título do sistema */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">ProAlta</h1>
            <p className="text-xs text-muted-foreground">Painel Hospitalar</p>
          </div>
        </div>

        {/* Links de navegação do menu */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Botão de sair na parte inferior da sidebar */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Área de conteúdo principal — renderiza a rota filha */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
