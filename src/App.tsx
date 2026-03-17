import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import VideoLibrary from "./pages/VideoLibrary";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import Checklist from "./pages/Checklist";
import Questions from "./pages/Questions";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/biblioteca" element={<VideoLibrary />} />
            <Route path="/orientacoes" element={<Guides />} />
            <Route path="/orientacoes/:id" element={<GuideDetail />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/duvidas" element={<Questions />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
