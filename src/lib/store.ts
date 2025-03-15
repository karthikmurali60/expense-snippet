
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Category, Subcategory, Expense, CategoryType } from './types';
import { toast } from 'sonner';

interface ExpenseStore {
  initialized: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  expenses: Expense[];
  
  // Initialization actions
  initializeStore: () => Promise<void>;
  
  // Category actions
  addCategory: (name: string, type: CategoryType, icon: string) => Promise<void>;
  updateCategory: (id: string, name: string, type: CategoryType, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Subcategory actions
  addSubcategory: (name: string, categoryId: string) => Promise<void>;
  updateSubcategory: (id: string, name: string, categoryId: string) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
  
  // Expense actions
  addExpense: (amount: number, description: string, date: Date, categoryId: string, subcategoryId: string) => Promise<void>;
  updateExpense: (id: string, amount: number, description: string, date: Date, categoryId: string, subcategoryId: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Statistics actions
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyStatistics: (month: string) => { 
    totalAmount: number;
    categoryBreakdown: { id: string; name: string; total: number; color: string }[];
  };
  getMonthlyTotal: (month: string) => number;
}

// Helper function to get default categories and subcategories
const getDefaultCategories = (): Category[] => [
  { id: uuidv4(), name: 'Car', type: 'car', icon: 'Car' },
  { id: uuidv4(), name: 'Groceries', type: 'groceries', icon: 'ShoppingBag' },
  { id: uuidv4(), name: 'Home', type: 'home', icon: 'Home' },
  { id: uuidv4(), name: 'Food', type: 'food', icon: 'Utensils' },
  { id: uuidv4(), name: 'Miscellaneous', type: 'misc', icon: 'Gift' }
];

const getDefaultSubcategories = (categories: Category[]): Subcategory[] => {
  const subcategories: Subcategory[] = [];
  
  const carId = categories.find(c => c.type === 'car')?.id || '';
  const groceriesId = categories.find(c => c.type === 'groceries')?.id || '';
  const homeId = categories.find(c => c.type === 'home')?.id || '';
  const foodId = categories.find(c => c.type === 'food')?.id || '';
  const miscId = categories.find(c => c.type === 'misc')?.id || '';
  
  // Car subcategories
  if (carId) {
    subcategories.push(
      { id: uuidv4(), name: 'Gas', categoryId: carId },
      { id: uuidv4(), name: 'Maintenance', categoryId: carId },
      { id: uuidv4(), name: 'Insurance', categoryId: carId }
    );
  }
  
  // Groceries subcategories
  if (groceriesId) {
    subcategories.push(
      { id: uuidv4(), name: 'Supermarket', categoryId: groceriesId },
      { id: uuidv4(), name: 'Farmers Market', categoryId: groceriesId }
    );
  }
  
  // Home subcategories
  if (homeId) {
    subcategories.push(
      { id: uuidv4(), name: 'Rent/Mortgage', categoryId: homeId },
      { id: uuidv4(), name: 'Utilities', categoryId: homeId },
      { id: uuidv4(), name: 'Furniture', categoryId: homeId }
    );
  }
  
  // Food subcategories
  if (foodId) {
    subcategories.push(
      { id: uuidv4(), name: 'Restaurants', categoryId: foodId },
      { id: uuidv4(), name: 'Delivery', categoryId: foodId },
      { id: uuidv4(), name: 'Takeout', categoryId: foodId }
    );
  }
  
  // Misc subcategories
  if (miscId) {
    subcategories.push(
      { id: uuidv4(), name: 'Entertainment', categoryId: miscId },
      { id: uuidv4(), name: 'Gifts', categoryId: miscId },
      { id: uuidv4(), name: 'Other', categoryId: miscId }
    );
  }
  
  return subcategories;
};

export const useExpenseStore = create<ExpenseStore>()((set, get) => {
  return {
    initialized: false,
    categories: [],
    subcategories: [],
    expenses: [],
    
    initializeStore: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          console.log("No active session, can't fetch data");
          return;
        }
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        
        if (categoriesError) {
          throw categoriesError;
        }
        
        // If no categories exist, create default ones
        if (categoriesData.length === 0) {
          const defaultCategories = getDefaultCategories();
          
          for (const category of defaultCategories) {
            await supabase.from('categories').insert({
              id: category.id,
              name: category.name,
              type: category.type,
              icon: category.icon,
              user_id: session.session.user.id
            });
          }
          
          // Fetch again after creating
          const { data: newCategoriesData } = await supabase
            .from('categories')
            .select('*');
            
          set({ categories: newCategoriesData || [] });
          
          // Create default subcategories
          const defaultSubcategories = getDefaultSubcategories(newCategoriesData || []);
          
          for (const subcategory of defaultSubcategories) {
            await supabase.from('subcategories').insert({
              id: subcategory.id,
              name: subcategory.name,
              category_id: subcategory.categoryId,
              user_id: session.session.user.id
            });
          }
        } else {
          set({ categories: categoriesData });
        }
        
        // Fetch subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*');
        
        if (subcategoriesError) {
          throw subcategoriesError;
        }
        
        // Transform subcategories to match our store format
        const transformedSubcategories = subcategoriesData.map(subcat => ({
          id: subcat.id,
          name: subcat.name,
          categoryId: subcat.category_id
        }));
        
        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*');
        
        if (expensesError) {
          throw expensesError;
        }
        
        // Transform expenses to match our store format
        const transformedExpenses = expensesData.map(exp => ({
          id: exp.id,
          amount: Number(exp.amount),
          description: exp.description,
          date: new Date(exp.date),
          categoryId: exp.category_id,
          subcategoryId: exp.subcategory_id
        }));
        
        set({ 
          subcategories: transformedSubcategories,
          expenses: transformedExpenses,
          initialized: true
        });
      } catch (error) {
        console.error('Error initializing store:', error);
        toast.error('Failed to load data. Please try again later.');
      }
    },
    
    addCategory: async (name, type, icon) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        
        const newId = uuidv4();
        const { error } = await supabase.from('categories').insert({
          id: newId,
          name,
          type,
          icon,
          user_id: session.session.user.id
        });
        
        if (error) throw error;
        
        const newCategory = { id: newId, name, type, icon };
        set(state => ({
          categories: [...state.categories, newCategory]
        }));
        
        toast.success('Category added successfully');
      } catch (error: any) {
        console.error('Error adding category:', error);
        toast.error('Failed to add category: ' + error.message);
      }
    },
    
    updateCategory: async (id, name, type, icon) => {
      try {
        const { error } = await supabase
          .from('categories')
          .update({ name, type, icon })
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          categories: state.categories.map(cat => 
            cat.id === id ? { ...cat, name, type, icon } : cat
          )
        }));
        
        toast.success('Category updated successfully');
      } catch (error: any) {
        console.error('Error updating category:', error);
        toast.error('Failed to update category: ' + error.message);
      }
    },
    
    deleteCategory: async (id) => {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Delete the category from local state
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
          // Also filter out subcategories of this category from local state
          subcategories: state.subcategories.filter(subcat => subcat.categoryId !== id),
          // And filter out expenses of this category from local state
          expenses: state.expenses.filter(exp => exp.categoryId !== id)
        }));
        
        toast.success('Category deleted successfully');
      } catch (error: any) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category: ' + error.message);
      }
    },
    
    addSubcategory: async (name, categoryId) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        
        const newId = uuidv4();
        const { error } = await supabase.from('subcategories').insert({
          id: newId,
          name,
          category_id: categoryId,
          user_id: session.session.user.id
        });
        
        if (error) throw error;
        
        const newSubcategory = { id: newId, name, categoryId };
        set(state => ({
          subcategories: [...state.subcategories, newSubcategory]
        }));
        
        toast.success('Subcategory added successfully');
      } catch (error: any) {
        console.error('Error adding subcategory:', error);
        toast.error('Failed to add subcategory: ' + error.message);
      }
    },
    
    updateSubcategory: async (id, name, categoryId) => {
      try {
        const { error } = await supabase
          .from('subcategories')
          .update({ name, category_id: categoryId })
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          subcategories: state.subcategories.map(subcat => 
            subcat.id === id ? { ...subcat, name, categoryId } : subcat
          )
        }));
        
        toast.success('Subcategory updated successfully');
      } catch (error: any) {
        console.error('Error updating subcategory:', error);
        toast.error('Failed to update subcategory: ' + error.message);
      }
    },
    
    deleteSubcategory: async (id) => {
      try {
        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          subcategories: state.subcategories.filter(subcat => subcat.id !== id),
          // Also filter out expenses with this subcategory from local state
          expenses: state.expenses.filter(exp => exp.subcategoryId !== id)
        }));
        
        toast.success('Subcategory deleted successfully');
      } catch (error: any) {
        console.error('Error deleting subcategory:', error);
        toast.error('Failed to delete subcategory: ' + error.message);
      }
    },
    
    addExpense: async (amount, description, date, categoryId, subcategoryId) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        
        const newId = uuidv4();
        const { error } = await supabase.from('expenses').insert({
          id: newId,
          amount,
          description,
          date,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          user_id: session.session.user.id
        });
        
        if (error) throw error;
        
        const newExpense = { 
          id: newId, 
          amount, 
          description, 
          date, 
          categoryId, 
          subcategoryId 
        };
        
        set(state => ({
          expenses: [...state.expenses, newExpense]
        }));
        
        toast.success('Expense added successfully');
      } catch (error: any) {
        console.error('Error adding expense:', error);
        toast.error('Failed to add expense: ' + error.message);
      }
    },
    
    updateExpense: async (id, amount, description, date, categoryId, subcategoryId) => {
      try {
        const { error } = await supabase
          .from('expenses')
          .update({ 
            amount, 
            description, 
            date, 
            category_id: categoryId,
            subcategory_id: subcategoryId 
          })
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          expenses: state.expenses.map(exp => 
            exp.id === id ? { 
              ...exp, 
              amount, 
              description, 
              date, 
              categoryId, 
              subcategoryId 
            } : exp
          )
        }));
        
        toast.success('Expense updated successfully');
      } catch (error: any) {
        console.error('Error updating expense:', error);
        toast.error('Failed to update expense: ' + error.message);
      }
    },
    
    deleteExpense: async (id) => {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        set(state => ({
          expenses: state.expenses.filter(exp => exp.id !== id)
        }));
        
        toast.success('Expense deleted successfully');
      } catch (error: any) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense: ' + error.message);
      }
    },
    
    getMonthlyExpenses: (month) => {
      const { expenses } = get();
      const [year, monthNum] = month.split('-').map(n => parseInt(n));
      const startDate = startOfMonth(new Date(year, monthNum - 1));
      const endDate = endOfMonth(startDate);
      
      return expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= endDate;
      });
    },
    
    getMonthlyStatistics: (month) => {
      const { categories, getMonthlyExpenses } = get();
      const monthlyExpenses = getMonthlyExpenses(month);
      
      const categoryTotals: Record<string, number> = {};
      
      // Initialize all categories with 0
      categories.forEach(cat => {
        categoryTotals[cat.id] = 0;
      });
      
      // Sum expenses by category
      monthlyExpenses.forEach(exp => {
        categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + exp.amount;
      });
      
      // Calculate total
      const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      
      // Format for display
      const categoryBreakdown = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        total: categoryTotals[cat.id] || 0,
        color: `expense-${cat.type}`
      }));
      
      return {
        totalAmount,
        categoryBreakdown: categoryBreakdown.filter(c => c.total > 0)
      };
    },
    
    getMonthlyTotal: (month) => {
      const monthlyExpenses = get().getMonthlyExpenses(month);
      return monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }
  };
});
