
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
  initializeStore: () => Promise<void>;
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
      
      initializeStore: async () => {
        console.log("Initializing store...");
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          // User is logged in, fetch data from Supabase
          try {
            console.log("User is logged in, fetching data...");
            await Promise.all([
              get().fetchCategories(),
              get().fetchSubCategories(),
              get().fetchExpenses()
            ]);
            
            console.log("Store initialized successfully");
            set({ initialized: true });
          } catch (error) {
            console.error("Failed to initialize store:", error);
            toast.error("Failed to initialize store");
            set({ initialized: true });
          }
        } else {
          // User is not logged in yet, just mark as initialized
          console.log("User is not logged in, marking as initialized");
          set({ initialized: true });
        }
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
          console.log("Fetching categories...");
          const { data: categoriesData, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

          if (error) {
            throw error;
          }

          if (categoriesData) {
            console.log("Categories fetched:", categoriesData.length);
            const categories = categoriesData.map(cat => convertToCategory(cat));
            set({ categories });
            
            // If no categories, create some default ones
            if (categories.length === 0) {
              const user = (await supabase.auth.getUser()).data.user;
              if (user) {
                console.log("Creating default categories...");
                await Promise.all([
                  get().createCategory({ name: 'Food', type: 'food', icon: 'Utensils' }),
                  get().createCategory({ name: 'Home', type: 'home', icon: 'Home' }),
                  get().createCategory({ name: 'Transportation', type: 'car', icon: 'Car' }),
                  get().createCategory({ name: 'Shopping', type: 'misc', icon: 'ShoppingCart' }),
                  get().createCategory({ name: 'Entertainment', type: 'misc', icon: 'Smile' })
                ]);
                
                // Fetch categories again after creating defaults
                const { data: newCategoriesData } = await supabase
                  .from('categories')
                  .select('*')
                  .order('name');
                  
                if (newCategoriesData) {
                  const newCategories = newCategoriesData.map(cat => convertToCategory(cat));
                  set({ categories: newCategories });
                  return newCategories;
                }
              }
            }
            
            return categories;
          }
          return [];
        } catch (error: any) {
          console.error('Failed to fetch categories:', error);
          toast.error('Failed to fetch categories: ' + error.message);
          return [];
        }
      },

      fetchSubCategories: async () => {
        try {
          console.log("Fetching subcategories...");
          const { data: subCategoriesData, error } = await supabase
            .from('subcategories')
            .select('*')
            .order('name');

          if (error) {
            throw error;
          }

          if (subCategoriesData) {
            console.log("Subcategories fetched:", subCategoriesData.length);
            const subcategories = subCategoriesData.map(subcat => convertToSubCategory(subcat));
            set({ subcategories });
            
            // If no subcategories and we have categories, create some defaults
            if (subcategories.length === 0 && get().categories.length > 0) {
              const user = (await supabase.auth.getUser()).data.user;
              if (user) {
                console.log("Creating default subcategories...");
                const categories = get().categories;
                
                // Create default subcategories for each category
                const createPromises = [];
                
                for (const category of categories) {
                  if (category.type === 'food') {
                    createPromises.push(
                      get().createSubCategory({ name: 'Restaurant', categoryId: category.id }),
                      get().createSubCategory({ name: 'Takeout', categoryId: category.id }),
                      get().createSubCategory({ name: 'Groceries', categoryId: category.id })
                    );
                  } else if (category.type === 'home') {
                    createPromises.push(
                      get().createSubCategory({ name: 'Rent', categoryId: category.id }),
                      get().createSubCategory({ name: 'Utilities', categoryId: category.id }),
                      get().createSubCategory({ name: 'Furniture', categoryId: category.id })
                    );
                  } else if (category.type === 'car') {
                    createPromises.push(
                      get().createSubCategory({ name: 'Gas', categoryId: category.id }),
                      get().createSubCategory({ name: 'Maintenance', categoryId: category.id }),
                      get().createSubCategory({ name: 'Parking', categoryId: category.id })
                    );
                  } else {
                    createPromises.push(
                      get().createSubCategory({ name: 'General', categoryId: category.id })
                    );
                  }
                }
                
                await Promise.all(createPromises);
                
                // Fetch subcategories again after creating defaults
                const { data: newSubCategoriesData } = await supabase
                  .from('subcategories')
                  .select('*')
                  .order('name');
                  
                if (newSubCategoriesData) {
                  const newSubcategories = newSubCategoriesData.map(subcat => convertToSubCategory(subcat));
                  set({ subcategories: newSubcategories });
                  return newSubcategories;
                }
              }
            }
            
            return subcategories;
          }
          return [];
        } catch (error: any) {
          console.error('Failed to fetch subcategories:', error);
          toast.error('Failed to fetch subcategories: ' + error.message);
          return [];
        }
      },

      fetchExpenses: async () => {
        try {
          console.log("Fetching expenses...");
          const { data: expensesData, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            throw error;
          }

          if (expensesData) {
            console.log("Expenses fetched:", expensesData.length);
            const expenses = expensesData.map(exp => convertToExpense(exp));
            set({ expenses });
            return expenses;
          }
          return [];
        } catch (error: any) {
          console.error('Failed to fetch expenses:', error);
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
          console.error('Failed to add expense:', error);
          toast.error('Failed to add expense: ' + error.message);
          throw error; // Re-throw to handle in component
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
          console.error('Failed to update expense:', error);
          toast.error('Failed to update expense: ' + error.message);
          throw error; // Re-throw to handle in component
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
          console.error('Failed to delete expense:', error);
          toast.error('Failed to delete expense: ' + error.message);
        }
      },
      
      // Helper functions for statistics and filtering
      getMonthlyExpenses: (month) => {
        const expenses = get().expenses;
        return expenses.filter(expense => {
          // Check if expense.date is a Date object
          if (!(expense.date instanceof Date)) {
            console.error('Invalid date object:', expense);
            return false;
          }
          
          try {
            const expenseMonth = expense.date.toISOString().substring(0, 7);
            return expenseMonth === month;
          } catch (error) {
            console.error('Error processing date:', error, expense);
            return false;
          }
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
      // Only persist non-sensitive data to localStorage
      partialize: (state) => ({
        initialized: state.initialized,
      }),
    }
  )
);
