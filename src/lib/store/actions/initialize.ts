
import { State, Store } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createInitializeAction = (set: any, get: () => Store) => ({
  initializeStore: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      // User is logged in, fetch data from Supabase
      try {
        console.log("Initializing store and fetching data...");
        
        // Make sure to use Promise.all to fetch data in parallel
        await Promise.all([
          get().fetchCategories(),
          get().fetchSubCategories(),
          get().fetchExpenses(),
          get().fetchBudgets(),
        ]);
        
        console.log("Store initialization complete");
        set({ initialized: true });
      } catch (error) {
        console.error("Failed to initialize store:", error);
        toast.error("Failed to initialize store");
        set({ initialized: true }); // Still mark as initialized to avoid infinite loops
      }
    } else {
      // User is not logged in yet, just mark as initialized
      console.log("User not logged in, marking store as initialized");
      set({ initialized: true });
    }
  }
});
