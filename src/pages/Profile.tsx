import { User, FileText, Bell, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const menuItems = [
  { icon: FileText, label: "Meus Documentos", description: "Orientações salvas" },
  { icon: Bell, label: "Notificações", description: "Gerenciar lembretes" },
  { icon: HelpCircle, label: "Ajuda", description: "Suporte e contato" },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Profile Card */}
      <div className="animate-fade-in mb-6 flex items-center gap-4 rounded-xl bg-card border border-border p-5 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Paciente</h2>
          <p className="text-sm text-muted-foreground">{user?.email ?? "Acesso via QR Code"}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            className="animate-slide-up flex items-center gap-4 rounded-xl bg-card border border-border p-4 text-left transition-all hover:shadow-sm hover:border-primary/20 active:scale-[0.98]"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.98]">
        <LogOut className="h-4 w-4" />
        Sair
      </button>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        ProAlta v1.0 · Orientação Nutricional
      </p>
    </div>
  );
};

export default Profile;
