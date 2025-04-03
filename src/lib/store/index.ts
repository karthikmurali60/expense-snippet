
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
        const { data: session } = await get().supabaseClient.auth.getSession();
        if (session.session) {
          // User is logged in, fetch data from Supabase
          try {
            await Promise.all([
              get().fetchCategories(),
              get().fetchSubCategories(),
              get().fetchExpenses()
            ]);
            
            set({ initialized: true });
          } catch (error) {
            console.error("Failed to initialize store:", error);
            set({ initialized: true }); // Still mark as initialized to avoid infinite loops
          }
        } else {
          // User is not logged in yet, just mark as initialized
          set({ initialized: true });
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
