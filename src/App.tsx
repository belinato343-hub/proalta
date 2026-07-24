/**
 * App.tsx — Arquivo raiz da aplicação.
 * Define todas as rotas, provedores globais (React Query, Tooltip, Auth)
 * e os guardas de rota (ProtectedRoute, AdminRoute, PublicRoute).
 */

import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

// Layouts continuam eager — sempre necessários para as rotas correspondentes
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import HomecareLayout from "./components/HomecareLayout";

// Páginas via lazy() → cada rota vira um chunk separado (code-splitting)
const Home = lazy(() => import("./pages/Home"));
const VideoLibrary = lazy(() => import("./pages/VideoLibrary"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const Checklist = lazy(() => import("./pages/Checklist"));
const PatientChat = lazy(() => import("./pages/PatientChat"));
const Questions = lazy(() => import("./pages/Questions"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MyDocuments = lazy(() => import("./pages/MyDocuments"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const SignupNoInvite = lazy(() => import("./pages/SignupNoInvite"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const PatientList = lazy(() => import("./pages/admin/PatientList"));
const AdminQuestions = lazy(() => import("./pages/admin/AdminQuestions"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Readmissions = lazy(() => import("./pages/admin/Readmissions"));
const Modules = lazy(() => import("./pages/admin/Modules"));
const PatientTherapies = lazy(() => import("./pages/admin/PatientTherapies"));
const AdminInvites = lazy(() => import("./pages/admin/AdminInvites"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const HomecareDashboard = lazy(() => import("./pages/homecare/HomecareDashboard"));
const HomecarePatients = lazy(() => import("./pages/homecare/HomecarePatients"));
const HomecareAnalytics = lazy(() => import("./pages/homecare/HomecareAnalytics"));
const HomecareInvites = lazy(() => import("./pages/homecare/HomecareInvites"));

/** Fallback exibido enquanto o chunk da rota é baixado */
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Instância do React Query para cache e gerenciamento de estado assíncrono */
const queryClient = new QueryClient();


/**
 * Guarda de rota para pacientes autenticados.
 * - Redireciona para /login se não houver sessão ativa.
 * - Redireciona admins para /admin automaticamente.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, isHomecare, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isHomecare) return <Navigate to="/homecare" replace />;
  return <>{children}</>;
};

/**
 * Guarda de rota para administradores hospitalares.
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
 * Guarda de rota para empresas de Home Care.
 */
const HomecareRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { isHomecare, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!isHomecare) return <Navigate to="/" replace />;
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
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* ===== Rotas públicas de autenticação ===== */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/cadastro/sem-convite" element={<SignupNoInvite />} />
            <Route path="/esqueci-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />

            {/* ===== Rotas do painel administrativo (hospital) ===== */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/pacientes" element={<PatientList />} />
              <Route path="/admin/convites" element={<AdminInvites />} />
              <Route path="/admin/duvidas" element={<AdminQuestions />} />
              <Route path="/admin/chat" element={<AdminChat />} />
              <Route path="/admin/relatorios" element={<Reports />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/reinternacoes" element={<Readmissions />} />
              <Route path="/admin/modulos" element={<Modules />} />
              <Route path="/admin/terapias" element={<PatientTherapies />} />
              <Route path="/admin/videos" element={<AdminVideos />} />
            </Route>

            {/* ===== Rotas do painel Home Care (B2B) ===== */}
            <Route element={<HomecareRoute><HomecareLayout /></HomecareRoute>}>
              <Route path="/homecare" element={<HomecareDashboard />} />
              <Route path="/homecare/pacientes" element={<HomecarePatients />} />
              <Route path="/homecare/analytics" element={<HomecareAnalytics />} />
              <Route path="/homecare/convites" element={<HomecareInvites />} />
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
              <Route path="/perfil/notificacoes" element={<Notifications />} />
            </Route>

            {/* Rota de fallback — página não encontrada */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
