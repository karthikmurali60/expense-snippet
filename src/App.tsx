
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from "react";
import { useExpenseStore } from "./lib/store";
import { supabase } from "./integrations/supabase/client";
import AuthWrapper from "./components/AuthWrapper";
import Index from "./pages/Index";
import AddExpense from "./pages/AddExpense";
import Statistics from "./pages/Statistics";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { initializeStore, initialized } = useExpenseStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !initialized) {
        initializeStore();
      }
    });
    
    // Check if already logged in and initialize if needed
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !initialized) {
        await initializeStore();
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeStore, initialized]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
