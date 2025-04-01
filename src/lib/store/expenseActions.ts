
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';
import { ExpenseActions, State, Store } from './types';
import { convertToExpense, supabaseClient, handleError } from './utils';

export const expenseActions = (set: any, get: () => Store): ExpenseActions => ({
  fetchExpenses: async () => {
    try {
      console.log("Fetching expenses...");
      const { data: expensesData, error } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (expensesData) {
        console.log("Expenses fetched:", expensesData.length);
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
  },

  addExpense: async (expense) => {
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
  },
  
  addRecurringExpense: async (expense) => {
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
  
  deleteExpense: async (id) => {
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
      const category = categories.find(c => c.id === id) || { name: 'Unknown', type: 'misc', icon: 'Package', id };
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
});
