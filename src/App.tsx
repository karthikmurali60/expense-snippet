
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from "react";
import { useExpenseStore } from "./lib/store";
import { supabase } from "./integrations/supabase/client";
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
    },
  },
});

// Create a protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const authenticated = !!data.session;
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

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
                <Route path="/add" element={
                  <ProtectedRoute>
                    <AddExpense />
                  </ProtectedRoute>
                } />
                <Route path="/statistics" element={
                  <ProtectedRoute>
                    <Statistics />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <Categories />
                  </ProtectedRoute>
                } />
                <Route path="/budgets" element={
                  <ProtectedRoute>
                    <Budgets />
                  </ProtectedRoute>
                } />
                <Route path="/goals" element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/upload-receipt" element={
                  <ProtectedRoute>
                    <UploadReceipt />
                  </ProtectedRoute>
                } />
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
