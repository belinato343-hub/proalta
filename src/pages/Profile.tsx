/**
 * Profile — Tela de perfil do paciente.
 * Permite visualizar e editar dados pessoais (nome, tipo de sonda, hospital).
 * Inclui menu de opções e botão de logout.
 */

import { useState, useEffect } from "react";
import { User, FileText, Bell, HelpCircle, LogOut, Save, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Itens do menu inferior do perfil */
const menuItems = [
  { icon: FileText, label: "Meus Documentos", description: "Resumo de alta e orientações", path: "/perfil/documentos" },
  { icon: Bell, label: "Notificações", description: "Gerenciar lembretes", path: "/perfil/notificacoes" },
  { icon: HelpCircle, label: "Ajuda", description: "Suporte e contato", path: "/chat" },
];

/** Tipos de sonda disponíveis para seleção */
const SONDA_TYPES = [
  "Sonda Nasoenteral (SNE)",
  "Sonda Nasogástrica (SNG)",
  "Gastrostomia (GTT)",
  "Jejunostomia (JJT)",
  "Outra",
];

/** Tipagem dos dados do perfil */
interface ProfileData {
  nome: string;
  tipo_sonda: string;
  hospital_origem: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nome: "",
    tipo_sonda: "",
    hospital_origem: "",
  });

  // Busca os dados do perfil ao montar o componente
  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  /** Busca os dados do perfil do usuário na tabela profiles */
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome, tipo_sonda, hospital_origem")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setProfile({
        nome: data.nome ?? "",
        tipo_sonda: data.tipo_sonda ?? "",
        hospital_origem: data.hospital_origem ?? "",
      });
    }
    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar perfil:", error);
    }
    setLoading(false);
  };

  /** Salva as alterações do perfil no banco de dados */
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: profile.nome || null,
        tipo_sonda: profile.tipo_sonda || null,
        hospital_origem: profile.hospital_origem || null,
      })
      .eq("user_id", user!.id);

    setSaving(false);
    if (error) {
      // Se não existe o registro, faz insert em vez de update
      if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: user!.id,
          nome: profile.nome || null,
          tipo_sonda: profile.tipo_sonda || null,
          hospital_origem: profile.hospital_origem || null,
        });
        if (insertError) {
          toast.error("Erro ao salvar perfil", { description: insertError.message });
          return;
        }
      } else {
        toast.error("Erro ao salvar perfil", { description: error.message });
        return;
      }
    }
    toast.success("Perfil atualizado!");
    setEditing(false);
  };

  /** Faz logout e redireciona para a tela de login */
  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Card principal do perfil */}
      <div className="animate-fade-in mb-6 rounded-xl bg-card border border-border p-5 shadow-sm">
        {/* Avatar, nome e e-mail */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              {profile.nome || "Paciente"}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email ?? "Acesso via QR Code"}</p>
          </div>
          {/* Botão de editar (visível apenas no modo de visualização) */}
          {!editing && (
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {editing ? (
          /* Formulário de edição do perfil */
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={profile.nome}
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_sonda" className="text-foreground">Tipo de sonda</Label>
              <Select
                value={profile.tipo_sonda}
                onValueChange={(v) => setProfile({ ...profile, tipo_sonda: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SONDA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospital" className="text-foreground">Hospital de origem</Label>
              <Input
                id="hospital"
                placeholder="Nome do hospital"
                value={profile.hospital_origem}
                onChange={(e) => setProfile({ ...profile, hospital_origem: e.target.value })}
              />
            </div>

            {/* Botões de salvar e cancelar */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* Exibição dos dados do perfil (modo leitura) */
          !loading && (
            <div className="space-y-2 text-sm">
              {profile.tipo_sonda && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <span className="text-muted-foreground">Sonda:</span>
                  <span className="font-medium text-foreground">{profile.tipo_sonda}</span>
                </div>
              )}
              {profile.hospital_origem && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <span className="text-muted-foreground">Hospital:</span>
                  <span className="font-medium text-foreground">{profile.hospital_origem}</span>
                </div>
              )}
              {/* Se nenhum dado foi preenchido, exibe botão para preencher */}
              {!profile.nome && !profile.tipo_sonda && !profile.hospital_origem && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 py-3 text-sm text-primary hover:bg-primary/10 transition-colors"
                >
                  Preencher dados do perfil
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* Menu de opções (Documentos, Notificações, Ajuda) */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
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

      {/* Botão de logout */}
      <button
        onClick={handleSignOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>

      {/* Rodapé com versão do app */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        ProAlta v1.0 · Orientação Nutricional
      </p>
    </div>
  );
};

export default Profile;
