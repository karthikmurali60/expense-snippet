
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CategoryType, Category, Subcategory, Expense } from './types';

export interface State {
  categories: Category[];
  subcategories: Subcategory[];
  expenses: Expense[];
  initialized: boolean;
}

export interface Actions {
  initializeStore: () => void;
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  createSubCategory: (subCategory: Omit<Subcategory, 'id'>) => Promise<Subcategory | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  updateSubCategory: (id: string, updates: Partial<Subcategory>) => Promise<Subcategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  deleteSubCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;
  fetchSubCategories: () => Promise<Subcategory[]>;
  fetchExpenses: () => Promise<Expense[]>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyStatistics: (month: string) => { totalAmount: number; categoryBreakdown: any[] };
}

export type Store = State & Actions;

// Fix for type conversion from Supabase to our app types
const convertToCategory = (dbCategory: any): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
  type: dbCategory.type as CategoryType,
  icon: dbCategory.icon
});

const convertToSubCategory = (dbSubCategory: any): Subcategory => ({
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
      subcategories: [],
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
              name: category.name,
              type: category.type,
              icon: category.icon,
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
              name: subCategory.name,
              category_id: subCategory.categoryId,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newSubCategory = convertToSubCategory(data);
            set((state) => ({
              subcategories: [...state.subcategories, newSubCategory]
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
          // Convert categoryId to category_id for database
          const dbUpdates = {
            ...(updates.name && { name: updates.name }),
            ...(updates.type && { type: updates.type }),
            ...(updates.icon && { icon: updates.icon })
          };
          
          const { data, error } = await supabase
            .from('categories')
            .update(dbUpdates)
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
          // Convert categoryId to category_id for database
          const dbUpdates = {
            ...(updates.name && { name: updates.name }),
            ...(updates.categoryId && { category_id: updates.categoryId })
          };
          
          const { data, error } = await supabase
            .from('subcategories')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedSubCategory = convertToSubCategory(data);
            set((state) => ({
              subcategories: state.subcategories.map((subcat) => (subcat.id === id ? updatedSubCategory : subcat))
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
            subcategories: state.subcategories.filter((subcat) => subcat.id !== id)
          }));
        } catch (error: any) {
          toast.error('Failed to delete subcategory: ' + error.message);
        }
      },

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
            const subcategories = subCategoriesData.map(subcat => convertToSubCategory(subcat));
            set({ subcategories });
            return subcategories;
          }
          return [];
        } catch (error: any) {
          toast.error('Failed to fetch subcategories: ' + error.message);
          return [];
        }
      },

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
          // Convert date to ISO string and field names for database
          const dbUpdates: any = {};
          
          if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString();
          if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
          if (updates.subcategoryId !== undefined) dbUpdates.subcategory_id = updates.subcategoryId;

          const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
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
      
      // Helper functions for statistics and filtering
      getMonthlyExpenses: (month) => {
        const expenses = get().expenses;
        return expenses.filter(expense => {
          const expenseMonth = expense.date.toISOString().substring(0, 7);
          return expenseMonth === month;
        });
      },
      
      getMonthlyStatistics: (month) => {
        const monthlyExpenses = get().getMonthlyExpenses(month);
        const categories = get().categories;
        
        // Calculate total amount
        const totalAmount = monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
        
        // Calculate breakdown by category
        const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
          const categoryId = expense.categoryId;
          acc[categoryId] = (acc[categoryId] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>);
        
        // Create category breakdown with names and colors
        const categoryBreakdown = Object.entries(categoryTotals).map(([id, total]) => {
          const category = categories.find(c => c.id === id) || { name: 'Unknown', type: 'misc' as CategoryType, icon: 'Package', id };
          return {
            id,
            name: category.name,
            total,
            color: category.type === 'food' ? 'green-500' : 
                   category.type === 'home' ? 'blue-500' : 
                   category.type === 'car' ? 'red-500' : 
                   category.type === 'groceries' ? 'yellow-500' : 'purple-500'
          };
        }).sort((a, b) => b.total - a.total);
        
        return { totalAmount, categoryBreakdown };
      }
    }),
    {
      name: 'expense-store',
    }
  )
);
