
import { toast } from 'sonner';
import { BudgetActions, State, Store } from './types';
import { convertToBudget, supabaseClient, handleError } from './utils';

export const budgetActions = (set: any, get: () => Store): BudgetActions => ({
  addBudget: async (budget) => {
    try {
      const user = (await supabaseClient.auth.getUser()).data.user;
      if (!user) throw new Error('You must be logged in to add budgets');

      const { data, error } = await supabaseClient
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
        set((state: State) => ({
          budgets: [...state.budgets, newBudget]
        }));
        return newBudget;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to add budget');
    }
  },
  
  updateBudget: async (id, updates) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.month !== undefined) dbUpdates.month = updates.month;
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;

      const { data, error } = await supabaseClient
        .from('budgets')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedBudget = convertToBudget(data);
        set((state: State) => ({
          budgets: state.budgets.map((budget) => (budget.id === id ? updatedBudget : budget))
        }));
        return updatedBudget;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to update budget');
    }
  },
  
  deleteBudget: async (id) => {
    try {
      const { error } = await supabaseClient.from('budgets').delete().eq('id', id);

      if (error) throw error;

      set((state: State) => ({
        budgets: state.budgets.filter((budget) => budget.id !== id)
      }));
      
      toast.success('Budget deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete budget');
      throw error;
    }
  },
  
  getBudgetByMonth: (month) => {
    const budgets = get().budgets.filter(budget => budget.month === month);
    const result: Record<string, any> = {};
    
    for (const budget of budgets) {
      result[budget.categoryId] = budget;
    }
    
    return result;
  },
  
  getBudgetProgress: (month) => {
    const budgets = get().getBudgetByMonth(month);
    const expenses = get().getMonthlyExpenses(month);
    
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
  }
});
