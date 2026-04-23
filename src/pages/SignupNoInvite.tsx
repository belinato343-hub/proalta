/**
 * SignupNoInvite — Landing exibida quando alguém acessa /cadastro sem invite.
 * Explica que o cadastro é restrito a pacientes convidados pelo hospital ou Home Care.
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Stethoscope } from "lucide-react";

const SignupNoInvite = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg animate-fade-in border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">Cadastro por convite</CardTitle>
          <CardDescription className="text-muted-foreground">
            O ProAlta é uma plataforma clínica restrita a pacientes acompanhados
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">
            Para garantir a qualidade do acompanhamento, sua conta precisa ser
            criada a partir de um convite enviado pelo seu hospital ou empresa
            de Home Care.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Você teve alta hospitalar?</p>
                <p className="text-xs text-muted-foreground">
                  Solicite o link de cadastro à equipe do hospital onde você foi atendido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Atendido por Home Care?</p>
                <p className="text-xs text-muted-foreground">
                  Peça à empresa que cuida de você para enviar o convite de acesso.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button asChild className="w-full">
              <Link to="/login">Já tenho conta — Entrar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupNoInvite;
