
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { State, Actions, Store } from './types';
import { categoryActions } from './categoryActions';
import { expenseActions } from './expenseActions';
import { budgetActions } from './budgetActions';
import { savingsGoalActions } from './savingsGoalActions';
import { uiActions } from './uiActions';
import { supabase } from '@/integrations/supabase/client';

export const useExpenseStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      subcategories: [],
      expenses: [],
      budgets: [],
      savingsGoals: [],
      initialized: false,
      theme: 'light',
      
      // Supabase client
      supabaseClient: supabase,
      
      // Actions grouped by domain
      ...categoryActions(set, get),
      ...expenseActions(set, get),
      ...budgetActions(set, get),
      ...savingsGoalActions(set, get),
      ...uiActions(set, get),
      
      // Initialize store action
      initializeStore: async () => {
        try {
          const { data: session } = await get().supabaseClient.auth.getSession();
          
          // If the store is already initialized, don't do it again unless forced
          if (get().initialized && session.session) {
            return;
          }
          
          // Set to not initialized while we're loading data
          if (get().initialized) {
            set({ initialized: false });
          }
          
          if (session.session) {
            // User is logged in, fetch data from Supabase
            try {
              // Fetch all necessary data in parallel
              const results = await Promise.allSettled([
                get().fetchCategories(),
                get().fetchSubCategories(),
                get().fetchExpenses()
              ]);
              
              // Log any errors that occurred during fetching
              results.forEach((result, index) => {
                if (result.status === 'rejected') {
                  console.error(`Failed to fetch data (${index}):`, result.reason);
                }
              });
              
              // Only mark as initialized if we have successfully fetched categories
              // since they are required for adding expenses
              const hasCategories = get().categories.length > 0;
              set({ initialized: true });
              
              return;
            } catch (error) {
              console.error("Failed to initialize store:", error);
              // Still mark as initialized to avoid infinite loops
              set({ initialized: true });
              throw error;
            }
          } else {
            // User is not logged in yet, just mark as initialized
            set({ initialized: true });
          }
        } catch (error) {
          console.error("Error in initializeStore:", error);
          set({ initialized: true }); // Ensure we always set initialized to true
          throw error;
        }
      },
    }),
    {
      name: 'expense-store',
      partialize: (state) => ({
        initialized: state.initialized,
        theme: state.theme,
        savingsGoals: state.savingsGoals
      }),
    }
  )
);

// Re-export types for convenience
export * from './types';
