import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { TradeProvider } from "@/context/TradeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import DiaryPage from "./pages/DiaryPage";
import SessionsPage from "./pages/SessionsPage";
import TradesPage from "./pages/TradesPage";
import AnalysesPage from "./pages/AnalysesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><TradeProvider><Index /></TradeProvider></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><TradeProvider><SessionsPage /></TradeProvider></ProtectedRoute>} />
            <Route path="/trades" element={<ProtectedRoute><TradeProvider><TradesPage /></TradeProvider></ProtectedRoute>} />
            <Route path="/diary" element={<ProtectedRoute><TradeProvider><DiaryPage /></TradeProvider></ProtectedRoute>} />
            <Route path="/analyses" element={<ProtectedRoute><TradeProvider><AnalysesPage /></TradeProvider></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
