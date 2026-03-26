/**
 * useAuth — Hook e Provider de autenticação.
 * Gerencia a sessão do usuário usando o Supabase Auth.
 * Disponibiliza session, user, loading e signOut via Context API.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Tipagem do contexto de autenticação */
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/** Contexto com valores padrão (nenhum usuário logado) */
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

/**
 * AuthProvider — Envolve a árvore de componentes para fornecer dados de autenticação.
 * Escuta mudanças de estado do auth (login, logout, expiração de token).
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta eventos de autenticação em tempo real (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Busca a sessão atual ao montar o componente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Remove o listener ao desmontar
    return () => subscription.unsubscribe();
  }, []);

  /** Encerra a sessão do usuário */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook para acessar os dados de autenticação em qualquer componente */
export const useAuth = () => useContext(AuthContext);
