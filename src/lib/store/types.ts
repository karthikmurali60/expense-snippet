
import { supabase } from '@/integrations/supabase/client';
import { CategoryType, Category, Subcategory, Expense, Budget, SavingsGoal } from '../types';

export interface State {
  categories: Category[];
  subcategories: Subcategory[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  initialized: boolean;
  theme: 'light' | 'dark';
}

export interface CategoryActions {
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  createSubCategory: (subCategory: Omit<Subcategory, 'id'>) => Promise<Subcategory | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  updateSubCategory: (id: string, updates: Partial<Subcategory>) => Promise<Subcategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  deleteSubCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;
  fetchSubCategories: () => Promise<Subcategory[]>;
}

export interface ExpenseActions {
  fetchExpenses: () => Promise<Expense[]>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
  addRecurringExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense[]>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyStatistics: (month: string) => { totalAmount: number; categoryBreakdown: any[] };
}

export interface BudgetActions {
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<Budget | null>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget | null>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetByMonth: (month: string) => Record<string, Budget>;
  getBudgetProgress: (month: string) => {
    categoryId: string;
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
  }[];
}

export interface SavingsGoalActions {
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<SavingsGoal | null>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<SavingsGoal | null>;
  deleteSavingsGoal: (id: string) => Promise<void>;
}

export interface UIActions {
  toggleTheme: () => void;
}

export interface UtilActions {
  supabaseClient: typeof supabase;
  initializeStore: () => Promise<void>;
}

export type Actions = CategoryActions & ExpenseActions & BudgetActions & SavingsGoalActions & UIActions & UtilActions;

export type Store = State & Actions;

// Re-export types from the main types file to fix the error
export { Category, Subcategory, Expense, Budget, SavingsGoal, CategoryType } from '../types';
