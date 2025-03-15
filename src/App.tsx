
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { useEffect } from "react";
import { useExpenseStore } from "./lib/store";
import AuthWrapper from "./components/AuthWrapper";
import Index from "./pages/Index";
import AddExpense from "./pages/AddExpense";
import Statistics from "./pages/Statistics";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { initializeStore, initialized } = useExpenseStore();
  
  useEffect(() => {
    if (!initialized) {
      initializeStore();
    }
  }, [initializeStore, initialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthWrapper>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/add" element={<AddExpense />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </AuthWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
