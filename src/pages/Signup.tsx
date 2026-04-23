/**
 * Signup — Cadastro de pacientes via convite (token).
 * 
 * Fluxo:
 * 1. Lê ?invite=TOKEN da URL
 * 2. Sem token → redireciona para /cadastro/sem-convite (landing explicativa)
 * 3. Com token → valida via RPC get_invite_preview e mostra hospital/empresa/terapia
 * 4. Se válido, formulário pede nome/email/senha
 * 5. Submete para edge function redeem-invite que cria conta + vincula tudo
 * 6. Após sucesso, faz login automático e redireciona para /
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Mail, Lock, Eye, EyeOff, User, Building2, AlertTriangle } from "lucide-react";

interface InvitePreview {
  valid: boolean;
  hospital_name: string | null;
  company_name: string | null;
  module_name: string | null;
  patient_name: string | null;
  reason: string;
}

const REASON_LABELS: Record<string, string> = {
  not_found: "Convite não encontrado. Verifique o link recebido.",
  revoked: "Este convite foi revogado pelo administrador.",
  already_used: "Este convite já foi utilizado para criar uma conta.",
};

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("invite");

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [checking, setChecking] = useState(true);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sem token → redireciona para landing explicativa
  useEffect(() => {
    if (!token) {
      navigate("/cadastro/sem-convite", { replace: true });
      return;
    }
    const validate = async () => {
      const { data, error } = await supabase.rpc("get_invite_preview", { _token: token });
      if (error || !data || data.length === 0) {
        setPreview({ valid: false, hospital_name: null, company_name: null, module_name: null, patient_name: null, reason: "not_found" });
      } else {
        const row = data[0] as InvitePreview;
        setPreview(row);
        if (row.patient_name) setNome(row.patient_name);
      }
      setChecking(false);
    };
    validate();
  }, [token, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (nome.trim().length < 2) {
      toast.error("Informe seu nome completo");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("redeem-invite", {
      body: { token, email, password, nome: nome.trim() },
    });
    
    if (error || (data as any)?.error) {
      const msg = (data as any)?.error ?? error?.message ?? "Erro ao criar conta";
      toast.error("Não foi possível criar a conta", { description: msg });
      setLoading(false);
      return;
    }

    // Login automático
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInErr) {
      toast.success("Conta criada!", { description: "Faça login para continuar." });
      navigate("/login");
    } else {
      toast.success("Bem-vindo!", { description: "Conta criada com sucesso." });
      navigate("/");
    }
  };

  // Estado de carregamento da validação
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Convite inválido
  if (!preview?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-foreground">Convite inválido</CardTitle>
            <CardDescription className="text-muted-foreground">
              {REASON_LABELS[preview?.reason ?? "not_found"] ?? "Este convite não pode ser usado."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Solicite um novo convite ao seu hospital ou empresa de Home Care.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgName = preview.hospital_name ?? preview.company_name;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md animate-fade-in border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-2xl font-bold text-primary">P</span>
          </div>
          <CardTitle className="text-2xl text-foreground">Criar sua conta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Você foi convidado para o ProAlta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Card de contexto do convite */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{orgName}</p>
                {preview.module_name && (
                  <p className="text-xs text-muted-foreground">
                    Terapia: <span className="font-medium text-foreground">{preview.module_name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nome" type="text" placeholder="Seu nome" value={nome}
                  onChange={(e) => setNome(e.target.value)} className="pl-10" required maxLength={120} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="confirmPassword" type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
