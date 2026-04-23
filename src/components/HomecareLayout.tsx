/**
 * HomecareLayout — Layout do painel para empresas de Home Care (B2B).
 * Reaproveita estrutura do AdminLayout com navegação própria.
 */

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

const items = [
  { path: "/homecare", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/homecare/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/homecare/pacientes", icon: Users, label: "Pacientes" },
  { path: "/homecare/convites", icon: Mail, label: "Convites" },
];

const HomecareLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">H</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">ProAlta</h1>
            <p className="text-xs text-muted-foreground">Home Care</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
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

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default HomecareLayout;
