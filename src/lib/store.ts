import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CategoryType, Category, Subcategory, Expense, Budget, SavingsGoal, RecurringExpenseDetails } from './types';
import { addMonths, format } from 'date-fns';

export interface State {
  categories: Category[];
  subcategories: Subcategory[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  initialized: boolean;
  theme: 'light' | 'dark';
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
  addRecurringExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense[]>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyStatistics: (month: string) => { totalAmount: number; categoryBreakdown: any[] };
  
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
  
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<SavingsGoal | null>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<SavingsGoal | null>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  
  toggleTheme: () => void;
}

export type Store = State & Actions;

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

const convertToExpense = (dbExpense: any): Expense => {
  const expense: Expense = {
    id: dbExpense.id,
    amount: parseFloat(dbExpense.amount),
    description: dbExpense.description,
    date: new Date(dbExpense.date),
    categoryId: dbExpense.category_id,
    subcategoryId: dbExpense.subcategory_id
  };

  // Add recurring details if present
  if (dbExpense.recurring_data) {
    try {
      expense.recurring = typeof dbExpense.recurring_data === 'string' 
        ? JSON.parse(dbExpense.recurring_data) 
        : dbExpense.recurring_data;
    } catch (error) {
      console.error('Error parsing recurring data:', error);
    }
  }

  return expense;
};

const convertToBudget = (dbBudget: any): Budget => ({
  id: dbBudget.id,
  amount: parseFloat(dbBudget.amount),
  month: dbBudget.month,
  categoryId: dbBudget.category_id
});

const convertToSavingsGoal = (dbGoal: any): SavingsGoal => ({
  id: dbGoal.id,
  name: dbGoal.name,
  targetAmount: parseFloat(dbGoal.target_amount),
  currentAmount: parseFloat(dbGoal.current_amount),
  dueDate: dbGoal.due_date ? new Date(dbGoal.due_date) : undefined,
  icon: dbGoal.icon,
  color: dbGoal.color
});

export const useExpenseStore = create<Store>()(
  persist(
    (set, get) => ({
      categories: [],
      subcategories: [],
      expenses: [],
      budgets: [],
      savingsGoals: [],
      initialized: false,
      theme: 'light',
      
      initializeStore: async () => {
        const { data: session } = await supabase.auth.getSession();
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
            toast.error("Failed to initialize store");
            set({ initialized: true }); // Still mark as initialized to avoid infinite loops
          }
        } else {
          // User is not logged in yet, just mark as initialized
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
          // First delete all subcategories that belong to this category
          const subcategoriesToDelete = get().subcategories.filter(s => s.categoryId === id);
          for (const subcategory of subcategoriesToDelete) {
            await get().deleteSubCategory(subcategory.id);
          }
          
          // Then delete all expenses directly associated with this category
          const expensesToDelete = get().expenses.filter(e => e.categoryId === id);
          for (const expense of expensesToDelete) {
            await get().deleteExpense(expense.id);
          }
          
          // Finally delete the category itself
          const { error } = await supabase.from('categories').delete().eq('id', id);

          if (error) throw error;

          // Update state to remove the deleted category
          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== id)
          }));
          
          toast.success('Category deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete category:', error);
          toast.error('Failed to delete category: ' + error.message);
          throw error;
        }
      },
      
      deleteSubCategory: async (id) => {
        try {
          // First delete all expenses associated with this subcategory
          const expensesToDelete = get().expenses.filter(e => e.subcategoryId === id);
          for (const expense of expensesToDelete) {
            await get().deleteExpense(expense.id);
          }
          
          // Then delete the subcategory
          const { error } = await supabase.from('subcategories').delete().eq('id', id);

          if (error) throw error;

          // Update state to remove the deleted subcategory
          set((state) => ({
            subcategories: state.subcategories.filter((subcat) => subcat.id !== id)
          }));
          
          toast.success('Subcategory deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete subcategory:', error);
          toast.error('Failed to delete subcategory: ' + error.message);
          throw error;
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
            
            // If no categories, create some default ones
            if (categories.length === 0) {
              const user = (await supabase.auth.getUser()).data.user;
              if (user) {
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
            
            // If no subcategories and we have categories, create some defaults
            if (subcategories.length === 0 && get().categories.length > 0) {
              const user = (await supabase.auth.getUser()).data.user;
              if (user) {
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
          const { data: expensesData, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            throw error;
          }

          if (expensesData) {
            const expenses = expensesData.map(exp => {
              try {
                return convertToExpense(exp);
              } catch (e) {
                console.error('Error converting expense:', e, exp);
                return null;
              }
            }).filter(Boolean) as Expense[];
            
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

          // Convert recurring data to JSON string if it exists
          const recurringData = expense.recurring 
            ? JSON.stringify(expense.recurring)
            : null;

          const { data, error } = await supabase
            .from('expenses')
            .insert({
              amount: expense.amount,
              description: expense.description,
              date: expense.date.toISOString(),
              category_id: expense.categoryId,
              subcategory_id: expense.subcategoryId,
              recurring_data: recurringData,
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
          throw error;
        }
      },
      
      addRecurringExpense: async (expense) => {
        try {
          if (!expense.recurring?.isRecurring || !expense.recurring.months || expense.recurring.months <= 0) {
            // If not recurring or invalid months, add as a normal expense
            const result = await get().addExpense(expense);
            return result ? [result] : [];
          }

          const months = expense.recurring.months;
          const results: Expense[] = [];
          const baseDate = new Date(expense.date);
          
          // Add expense for each month in the sequence
          for (let i = 0; i < months; i++) {
            const currentDate = addMonths(baseDate, i);
            const currentMonth = format(currentDate, 'yyyy-MM');
            
            // Create a recurring expense entry for this month
            const monthExpense = {
              ...expense,
              date: currentDate,
              recurring: {
                ...expense.recurring,
                startMonth: i === 0 ? currentMonth : expense.recurring.startMonth
              }
            };
            
            const result = await get().addExpense(monthExpense);
            if (result) results.push(result);
          }
          
          return results;
        } catch (error: any) {
          console.error('Failed to add recurring expenses:', error);
          toast.error('Failed to add recurring expenses: ' + error.message);
          throw error;
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
          if (updates.recurring !== undefined) {
            dbUpdates.recurring_data = updates.recurring ? JSON.stringify(updates.recurring) : null;
          }

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
          throw error;
        }
      },
      
      deleteExpense: async (id) => {
        try {
          const { error } = await supabase.from('expenses').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id)
          }));
          
          toast.success('Expense deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete expense:', error);
          toast.error('Failed to delete expense: ' + error.message);
          throw error;
        }
      },
      
      getMonthlyExpenses: (month) => {
        const expenses = get().expenses;
        return expenses.filter(expense => {
          // Check if expense.date is a Date object
          if (!(expense.date instanceof Date)) {
            console.error('Invalid date object:', expense);
            return false;
          }
          
          try {
            // Use format from date-fns to get local time month in YYYY-MM format
            const expenseMonth = format(expense.date, 'yyyy-MM');
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
            color: category.type === 'food' ? 'red-500' : 
                   category.type === 'home' ? 'orange-500' : 
                   category.type === 'car' ? 'blue-500' : 
                   category.type === 'groceries' ? 'green-500' : 
                   category.type === 'misc' ? 'purple-500' : 'pink-500'
          };
        }).sort((a, b) => b.total - a.total);
        
        return { totalAmount, categoryBreakdown };
      },
      
      addBudget: async (budget) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('You must be logged in to add budgets');

          const { data, error } = await supabase
            .from('budgets')
            .insert({
              amount: budget.amount,
              month: budget.month,
              category_id: budget.categoryId,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newBudget = convertToBudget(data);
            set((state) => ({
              budgets: [...state.budgets, newBudget]
            }));
            return newBudget;
          }
          return null;
        } catch (error: any) {
          console.error('Failed to add budget:', error);
          toast.error('Failed to add budget: ' + error.message);
          throw error;
        }
      },
      
      updateBudget: async (id, updates) => {
        try {
          const dbUpdates: any = {};
          
          if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
          if (updates.month !== undefined) dbUpdates.month = updates.month;
          if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;

          const { data, error } = await supabase
            .from('budgets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedBudget = convertToBudget(data);
            set((state) => ({
              budgets: state.budgets.map((budget) => (budget.id === id ? updatedBudget : budget))
            }));
            return updatedBudget;
          }
          return null;
        } catch (error: any) {
          console.error('Failed to update budget:', error);
          toast.error('Failed to update budget: ' + error.message);
          throw error;
        }
      },
      
      deleteBudget: async (id) => {
        try {
          const { error } = await supabase.from('budgets').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            budgets: state.budgets.filter((budget) => budget.id !== id)
          }));
          
          toast.success('Budget deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete budget:', error);
          toast.error('Failed to delete budget: ' + error.message);
          throw error;
        }
      },
      
      getBudgetByMonth: (month) => {
        const budgets = get().budgets.filter(budget => budget.month === month);
        const result: Record<string, Budget> = {};
        
        for (const budget of budgets) {
          result[budget.categoryId] = budget;
        }
        
        return result;
      },
      
      getBudgetProgress: (month) => {
        const budgets = get().getBudgetByMonth(month);
        const expenses = get().getMonthlyExpenses(month);
        const categories = get().categories;
        
        // Calculate total spent by category
        const totalSpentByCategory: Record<string, number> = {};
        for (const expense of expenses) {
          if (!totalSpentByCategory[expense.categoryId]) {
            totalSpentByCategory[expense.categoryId] = 0;
          }
          totalSpentByCategory[expense.categoryId] += expense.amount;
        }
        
        // Create budget progress data
        const result = [];
        
        // Add entries for categories with budgets
        for (const categoryId in budgets) {
          const budget = budgets[categoryId];
          const spent = totalSpentByCategory[categoryId] || 0;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          
          result.push({
            categoryId,
            budgetAmount: budget.amount,
            spentAmount: spent,
            percentage: Math.min(percentage, 100) // Cap at 100%
          });
        }
        
        // Add entries for categories without budgets but with expenses
        for (const categoryId in totalSpentByCategory) {
          if (!budgets[categoryId]) {
            result.push({
              categoryId,
              budgetAmount: 0,
              spentAmount: totalSpentByCategory[categoryId],
              percentage: 100 // No budget = 100% used
            });
          }
        }
        
        return result;
      },
      
      addSavingsGoal: async (goal) => {
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('You must be logged in to add savings goals');

          const { data, error } = await supabase
            .from('savings_goals')
            .insert({
              name: goal.name,
              target_amount: goal.targetAmount,
              current_amount: goal.currentAmount,
              due_date: goal.dueDate ? goal.dueDate.toISOString() : null,
              icon: goal.icon,
              color: goal.color,
              user_id: user.id
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newGoal = convertToSavingsGoal(data);
            set((state) => ({
              savingsGoals: [...state.savingsGoals, newGoal]
            }));
            return newGoal;
          }
          return null;
        } catch (error: any) {
          console.error('Failed to add savings goal:', error);
          toast.error('Failed to add savings goal: ' + error.message);
          throw error;
        }
      },
      
      updateSavingsGoal: async (id, updates) => {
        try {
          const dbUpdates: any = {};
          
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
          if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
          if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;
          if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
          if (updates.color !== undefined) dbUpdates.color = updates.color;

          const { data, error } = await supabase
            .from('savings_goals')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const updatedGoal = convertToSavingsGoal(data);
            set((state) => ({
              savingsGoals: state.savingsGoals.map((goal) => (goal.id === id ? updatedGoal : goal))
            }));
            return updatedGoal;
          }
          return null;
        } catch (error: any) {
          console.error('Failed to update savings goal:', error);
          toast.error('Failed to update savings goal: ' + error.message);
          throw error;
        }
      },
      
      deleteSavingsGoal: async (id) => {
        try {
          const { error } = await supabase.from('savings_goals').delete().eq('id', id);

          if (error) throw error;

          set((state) => ({
            savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id)
          }));
          
          toast.success('Savings goal deleted successfully');
        } catch (error: any) {
          console.error('Failed to delete savings goal:', error);
          toast.error('Failed to delete savings goal: ' + error.message);
          throw error;
        }
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }));
        
        // Update document class for theme
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(get().theme);
      }
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
