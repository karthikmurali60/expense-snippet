
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';
import { State, Store } from '../types';
import { handleError } from '../utils';

export const createRecurringExpenseActions = (set: any, get: () => Store) => ({
  addRecurringExpense: async (expense: any) => {
    try {
      if (!expense.recurring?.isRecurring || !expense.recurring.months || expense.recurring.months <= 0) {
        // If not recurring or invalid months, add as a normal expense
        const result = await get().addExpense(expense);
        return result ? [result] : [];
      }

      const months = expense.recurring.months;
      const results: any[] = [];
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
      handleError(error, 'Failed to add recurring expenses');
      throw error;
    }
  }
});
