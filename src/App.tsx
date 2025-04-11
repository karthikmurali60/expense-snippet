import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from "react";
import { useExpenseStore } from "./lib/store";
import { setupAuthListener } from "./lib/session";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthWrapper from "./components/AuthWrapper";
import Index from "./pages/Index";
import AddExpense from "./pages/AddExpense";
import Statistics from "./pages/Statistics";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import UploadReceipt from "./pages/UploadReceipt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

const App = () => {
  const { initializeStore, initialized, theme } = useExpenseStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Apply theme class to root document element
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    // Set up auth state listener with our new session management
    const unsubscribe = setupAuthListener(async (user) => {
      if (user && !initialized) {
        await initializeStore();
      }
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
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
    <ErrorBoundary>
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
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/upload-receipt" element={<UploadReceipt />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </AuthWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
