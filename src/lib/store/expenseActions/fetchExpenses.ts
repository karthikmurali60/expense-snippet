
import { toast } from 'sonner';
import { State, Store } from '../types';
import { convertToExpense, supabaseClient, handleError } from '../utils';

export const createFetchExpensesAction = (set: any, get: () => Store) => ({
  fetchExpenses: async () => {
    try {
      const { data: expensesData, error } = await supabaseClient
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
        }).filter(Boolean) as any[];
        
        set({ expenses });
        return expenses;
      }
      return [];
    } catch (error: any) {
      handleError(error, 'Failed to fetch expenses');
      return [];
    }
  }
});
