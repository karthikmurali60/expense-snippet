
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { State, Store } from './types';
import { categoryActions } from './categoryActions';
import { expenseActions } from './expenseActions';
import { budgetActions } from './budgetActions';
import { savingsGoalActions } from './savingsGoalActions';
import { uiActions } from './uiActions';
import { createInitializeAction } from './actions/initialize';
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
      
      // Domain actions
      ...categoryActions(set, get),
      ...expenseActions(set, get),
      ...budgetActions(set, get),
      ...savingsGoalActions(set, get),
      ...uiActions(set, get),
      
      // Initialize store action
      ...createInitializeAction(set, get)
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
