
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Category, Subcategory, Expense, Budget, SavingsGoal, CategoryType } from '../types';

// Convert database objects to app models
export const convertToCategory = (dbCategory: any): Category => ({
  id: dbCategory.id,
  name: dbCategory.name,
  type: dbCategory.type as CategoryType,
  icon: dbCategory.icon
});

export const convertToSubCategory = (dbSubCategory: any): Subcategory => ({
  id: dbSubCategory.id,
  name: dbSubCategory.name,
  categoryId: dbSubCategory.category_id
});

export const convertToExpense = (dbExpense: any): Expense => {
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

export const convertToBudget = (dbBudget: any): Budget => ({
  id: dbBudget.id,
  amount: parseFloat(dbBudget.amount),
  month: dbBudget.month,
  categoryId: dbBudget.category_id
});

export const convertToSavingsGoal = (dbGoal: any): SavingsGoal => ({
  id: dbGoal.id,
  name: dbGoal.name,
  targetAmount: parseFloat(dbGoal.target_amount),
  currentAmount: parseFloat(dbGoal.current_amount),
  dueDate: dbGoal.due_date ? new Date(dbGoal.due_date) : undefined,
  icon: dbGoal.icon,
  color: dbGoal.color
});

// Supabase client
export const supabaseClient = supabase;

// Error handling utility
export const handleError = (error: any, message: string): null => {
  console.error(`${message}:`, error);
  toast.error(`${message}: ${error.message}`);
  return null;
};
