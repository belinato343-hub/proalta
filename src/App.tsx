/**
 * App.tsx — Arquivo raiz da aplicação.
 * Define todas as rotas, provedores globais (React Query, Tooltip, Auth)
 * e os guardas de rota (ProtectedRoute, AdminRoute, PublicRoute).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import VideoLibrary from "./pages/VideoLibrary";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import Checklist from "./pages/Checklist";
import PatientChat from "./pages/PatientChat";
import Questions from "./pages/Questions";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import PatientList from "./pages/admin/PatientList";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminChat from "./pages/admin/AdminChat";
import Reports from "./pages/admin/Reports";
import Analytics from "./pages/admin/Analytics";

/** Instância do React Query para cache e gerenciamento de estado assíncrono */
const queryClient = new QueryClient();

/**
 * Guarda de rota para pacientes autenticados.
 * - Redireciona para /login se não houver sessão ativa.
 * - Redireciona admins para /admin automaticamente.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

/**
 * Guarda de rota para administradores hospitalares.
 * - Redireciona para /login se não houver sessão.
 * - Redireciona para / se o usuário não for admin.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/**
 * Guarda de rota para páginas públicas (login, cadastro).
 * - Redireciona para / se o usuário já estiver logado.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Componentes globais de notificação (toasts) */}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ===== Rotas públicas de autenticação ===== */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/esqueci-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />

            {/* ===== Rotas do painel administrativo (hospital) ===== */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/pacientes" element={<PatientList />} />
              <Route path="/admin/duvidas" element={<AdminQuestions />} />
              <Route path="/admin/chat" element={<AdminChat />} />
              <Route path="/admin/relatorios" element={<Reports />} />
              <Route path="/admin/analytics" element={<Analytics />} />
            </Route>

            {/* ===== Rotas protegidas do paciente ===== */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/biblioteca" element={<VideoLibrary />} />
              <Route path="/orientacoes" element={<Guides />} />
              <Route path="/orientacoes/:id" element={<GuideDetail />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/chat" element={<PatientChat />} />
              <Route path="/duvidas" element={<Questions />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>

            {/* Rota de fallback — página não encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
