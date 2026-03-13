import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TradeProvider } from "@/context/TradeContext";
import Index from "./pages/Index";
import CalculatorPage from "./pages/CalculatorPage";
import DiaryPage from "./pages/DiaryPage";
import StatsPage from "./pages/StatsPage";
import SessionsPage from "./pages/SessionsPage";
import TradesPage from "./pages/TradesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TradeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TradeProvider>
  </QueryClientProvider>
);

export default App;
