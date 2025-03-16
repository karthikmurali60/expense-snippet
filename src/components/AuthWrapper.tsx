
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession } from '@supabase/supabase-js';
import AuthForm from './AuthForm';
import { useExpenseStore } from '@/lib/store';
import { toast } from 'sonner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { initializeStore, initialized } = useExpenseStore();

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Initialize store if user is logged in
        if (session?.user && !initialized) {
          await initializeStore();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        toast.error("Failed to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      setSession(session);
      
      // Initialize store when user logs in
      if (session?.user && !initialized) {
        try {
          await initializeStore();
        } catch (error) {
          console.error("Error initializing store on auth change:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeStore, initialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="glass w-full max-w-md p-8 rounded-xl">
          <AuthForm />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
