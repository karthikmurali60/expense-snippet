
import { toast } from 'sonner';
import { State, Store } from '../types';
import { convertToExpense, supabaseClient, handleError } from '../utils';

export const createUpdateDeleteExpenseActions = (set: any, get: () => Store) => ({
  updateExpense: async (id: string, updates: any) => {
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

      const { data, error } = await supabaseClient
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedExpense = convertToExpense(data);
        set((state: State) => ({
          expenses: state.expenses.map((exp) => (exp.id === id ? updatedExpense : exp))
        }));
        return updatedExpense;
      }
      return null;
    } catch (error: any) {
      handleError(error, 'Failed to update expense');
      throw error;
    }
  },
  
  deleteExpense: async (id: string) => {
    try {
      const { error } = await supabaseClient.from('expenses').delete().eq('id', id);

      if (error) throw error;

      set((state: State) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      }));
      
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete expense');
      throw error;
    }
  }
});
