import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatISO } from 'date-fns';
import { CategoryType, SubCategoryType, ExpenseType, Category, SubCategory, Expense } from './types';

export interface State {
  categories: Category[];
  subCategories: SubCategory[];
  expenses: Expense[];
  initialized: boolean;
}

export interface Actions {
  initializeStore: () => void;
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  createSubCategory: (subCategory: Omit<SubCategory, 'id'>) => Promise<SubCategory | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  updateSubCategory: (id: string, updates: Partial<SubCategory>) => Promise<SubCategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  deleteSubCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;
  fetchSubCategories: () => Promise<SubCategory[]>;
  fetchExpenses: () => Promise<Expense[]>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
}

export type Store = State & Actions;

// Fix for type conversion from Supabase to our app types
const convertToCategory = (dbCategory: any): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
  type: dbCategory.type as CategoryType,
  icon: dbCategory.icon
});

const convertToSubCategory = (dbSubCategory: any): SubCategory => ({
  id: dbSubCategory.id,
  name: dbSubCategory.name,
  categoryId: dbSubCategory.category_id
});

const convertToExpense = (dbExpense: any): Expense => ({
  id: dbExpense.id,
  amount: parseFloat(dbExpense.amount),
  description: dbExpense.description,
  date: new Date(dbExpense.date),
  categoryId: dbExpense.category_id,
  subcategoryId: dbExpense.subcategory_id
});

export const useExpenseStore = create<Store>()(
  persist(
    (set, get) => ({
      categories: [],
      subCategories: [],
      expenses: [],
      initialized: false,
      initializeStore: () => {
        Promise.all([get().fetchCategories(), get().fetchSubCategories(), get().fetchExpenses()])
          .then(() => set({ initialized: true }))
          .catch((error) => {
            console.error("Failed to initialize store:", error);
            toast.error("Failed to initialize store.");
            set({ initialized: true });
          });
      },
      createCategory: async (category) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('You must be logged in to create categories');

          const { data, error } = await supabase
            .from('categories')
            .insert({
              ...category,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newCategory = convertToCategory(data);
            set((state) => ({
              categories: [...state.categories, newCategory]
            }));
            return newCategory;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to create category: ' + error.message);
          return null;
        }
      },
      createSubCategory: async (subCategory) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('You must be logged in to create subcategories');

          const { data, error } = await supabase
            .from('subcategories')
            .insert({
              ...subCategory,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newSubCategory = convertToSubCategory(data);
            set((state) => ({
              subCategories: [...state.subCategories, newSubCategory]
            }));
            return newSubCategory;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to create subcategory: ' + error.message);
          return null;
        }
      },
      updateCategory: async (id, updates) => {
        try {
          const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedCategory = convertToCategory(data);
            set((state) => ({
              categories: state.categories.map((cat) => (cat.id === id ? updatedCategory : cat))
            }));
            return updatedCategory;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to update category: ' + error.message);
          return null;
        }
      },
      updateSubCategory: async (id, updates) => {
        try {
          const { data, error } = await supabase
            .from('subcategories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedSubCategory = convertToSubCategory(data);
            set((state) => ({
              subCategories: state.subCategories.map((subcat) => (subcat.id === id ? updatedSubCategory : subcat))
            }));
            return updatedSubCategory;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to update subcategory: ' + error.message);
          return null;
        }
      },
      deleteCategory: async (id) => {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== id)
          }));
        } catch (error: any) {
          toast.error('Failed to delete category: ' + error.message);
        }
      },
      deleteSubCategory: async (id) => {
        try {
          const { error } = await supabase.from('subcategories').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            subCategories: state.subCategories.filter((subcat) => subcat.id !== id)
          }));
        } catch (error: any) {
          toast.error('Failed to delete subcategory: ' + error.message);
        }
      },

      // Update the fetchCategories method to fix type issues
      fetchCategories: async () => {
        try {
          const { data: categoriesData, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

          if (error) {
            throw error;
          }

          if (categoriesData) {
            const categories = categoriesData.map(cat => convertToCategory(cat));
            set({ categories });
            return categories;
          }
          return [];
        } catch (error: any) {
          toast.error('Failed to fetch categories: ' + error.message);
          return [];
        }
      },

      // Update the fetchSubCategories method
      fetchSubCategories: async () => {
        try {
          const { data: subCategoriesData, error } = await supabase
            .from('subcategories')
            .select('*')
            .order('name');

          if (error) {
            throw error;
          }

          if (subCategoriesData) {
            const subCategories = subCategoriesData.map(subcat => convertToSubCategory(subcat));
            set({ subCategories });
            return subCategories;
          }
          return [];
        } catch (error: any) {
          toast.error('Failed to fetch subcategories: ' + error.message);
          return [];
        }
      },

      // Update the fetchExpenses method
      fetchExpenses: async () => {
        try {
          const { data: expensesData, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            throw error;
          }

          if (expensesData) {
            const expenses = expensesData.map(exp => convertToExpense(exp));
            set({ expenses });
            return expenses;
          }
          return [];
        } catch (error: any) {
          toast.error('Failed to fetch expenses: ' + error.message);
          return [];
        }
      },

      // Update the addExpense method to fix date formatting
      addExpense: async (expense) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('You must be logged in to add expenses');

          const { data, error } = await supabase
            .from('expenses')
            .insert({
              amount: expense.amount,
              description: expense.description,
              date: expense.date.toISOString(),
              category_id: expense.categoryId,
              subcategory_id: expense.subcategoryId,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newExpense = convertToExpense(data);
            set((state) => ({
              expenses: [newExpense, ...state.expenses]
            }));
            return newExpense;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to add expense: ' + error.message);
          return null;
        }
      },
      updateExpense: async (id, updates) => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedExpense = convertToExpense(data);
            set((state) => ({
              expenses: state.expenses.map((exp) => (exp.id === id ? updatedExpense : exp))
            }));
            return updatedExpense;
          }
          return null;
        } catch (error: any) {
          toast.error('Failed to update expense: ' + error.message);
          return null;
        }
      },
      deleteExpense: async (id) => {
        try {
          const { error } = await supabase.from('expenses').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id)
          }));
        } catch (error: any) {
          toast.error('Failed to delete expense: ' + error.message);
        }
      },
    }),
    {
      name: 'expense-store',
    }
  )
);
