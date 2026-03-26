/**
 * Página 404 — Exibida quando o usuário acessa uma rota que não existe.
 * Registra um erro no console e oferece um link para voltar ao início.
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  // Loga a rota inválida no console para fins de depuração
  useEffect(() => {
    console.error("Erro 404: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
