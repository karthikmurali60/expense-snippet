
import { toast } from 'sonner';
import { State, Store } from '../types';
import { convertToExpense, supabaseClient, handleError } from '../utils';

export const createAddExpenseActions = (set: any, get: () => Store) => ({
  addExpense: async (expense: any) => {
    try {
      const user = (await supabaseClient.auth.getUser()).data.user;
      if (!user) throw new Error('You must be logged in to add expenses');

      // Convert recurring data to JSON string if it exists
      const recurringData = expense.recurring 
        ? JSON.stringify(expense.recurring)
        : null;

      const { data, error } = await supabaseClient
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
        set((state: State) => ({
          expenses: [newExpense, ...state.expenses]
        }));
        return newExpense;
      }
      return null;
    } catch (error: any) {
      handleError(error, 'Failed to add expense');
      throw error;
    }
  }
});
