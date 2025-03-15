
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Category, Subcategory, Expense, CategoryType } from './types';

interface ExpenseStore {
  categories: Category[];
  subcategories: Subcategory[];
  expenses: Expense[];
  
  // Category actions
  addCategory: (name: string, type: CategoryType, icon: string) => void;
  updateCategory: (id: string, name: string, type: CategoryType, icon: string) => void;
  deleteCategory: (id: string) => void;
  
  // Subcategory actions
  addSubcategory: (name: string, categoryId: string) => void;
  updateSubcategory: (id: string, name: string, categoryId: string) => void;
  deleteSubcategory: (id: string) => void;
  
  // Expense actions
  addExpense: (amount: number, description: string, date: Date, categoryId: string, subcategoryId: string) => void;
  updateExpense: (id: string, amount: number, description: string, date: Date, categoryId: string, subcategoryId: string) => void;
  deleteExpense: (id: string) => void;
  
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
  { id: uuidv4(), name: 'Car', type: 'car', icon: 'car' },
  { id: uuidv4(), name: 'Groceries', type: 'groceries', icon: 'shopping-bag' },
  { id: uuidv4(), name: 'Home', type: 'home', icon: 'home' },
  { id: uuidv4(), name: 'Food', type: 'food', icon: 'utensils' },
  { id: uuidv4(), name: 'Miscellaneous', type: 'misc', icon: 'gift' }
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

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => {
      // Initialize with default categories if empty
      const defaultCategories = getDefaultCategories();
      const defaultSubcategories = getDefaultSubcategories(defaultCategories);
      
      return {
        categories: defaultCategories,
        subcategories: defaultSubcategories,
        expenses: [],
        
        addCategory: (name, type, icon) => {
          const newCategory = { id: uuidv4(), name, type, icon };
          set(state => ({
            categories: [...state.categories, newCategory]
          }));
        },
        
        updateCategory: (id, name, type, icon) => {
          set(state => ({
            categories: state.categories.map(cat => 
              cat.id === id ? { ...cat, name, type, icon } : cat
            )
          }));
        },
        
        deleteCategory: (id) => {
          // Delete the category
          set(state => ({
            categories: state.categories.filter(cat => cat.id !== id),
            // Also delete all subcategories of this category
            subcategories: state.subcategories.filter(subcat => subcat.categoryId !== id),
            // And delete all expenses of this category
            expenses: state.expenses.filter(exp => exp.categoryId !== id)
          }));
        },
        
        addSubcategory: (name, categoryId) => {
          const newSubcategory = { id: uuidv4(), name, categoryId };
          set(state => ({
            subcategories: [...state.subcategories, newSubcategory]
          }));
        },
        
        updateSubcategory: (id, name, categoryId) => {
          set(state => ({
            subcategories: state.subcategories.map(subcat => 
              subcat.id === id ? { ...subcat, name, categoryId } : subcat
            )
          }));
        },
        
        deleteSubcategory: (id) => {
          set(state => ({
            subcategories: state.subcategories.filter(subcat => subcat.id !== id),
            // Also delete all expenses of this subcategory
            expenses: state.expenses.filter(exp => exp.subcategoryId !== id)
          }));
        },
        
        addExpense: (amount, description, date, categoryId, subcategoryId) => {
          const newExpense = { 
            id: uuidv4(), 
            amount, 
            description, 
            date, 
            categoryId, 
            subcategoryId 
          };
          set(state => ({
            expenses: [...state.expenses, newExpense]
          }));
        },
        
        updateExpense: (id, amount, description, date, categoryId, subcategoryId) => {
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
        },
        
        deleteExpense: (id) => {
          set(state => ({
            expenses: state.expenses.filter(exp => exp.id !== id)
          }));
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
    },
    {
      name: 'expense-tracker-storage',
    }
  )
);
