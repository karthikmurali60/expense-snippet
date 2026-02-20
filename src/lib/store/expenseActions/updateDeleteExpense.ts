
import { toast } from 'sonner';
import { State, Store } from '../types';
import { Expense } from '../../types';
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
      // Save snapshot for undo
      const snapshot = get().expenses.find((exp) => exp.id === id);
      if (!snapshot) return;

      // Optimistically remove from state
      set((state: State) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      }));

      let undone = false;

      toast('Expense deleted', {
        duration: 4000,
        action: {
          label: 'Undo',
          onClick: () => {
            undone = true;
            set((state: State) => ({
              expenses: [...state.expenses, snapshot].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )
            }));
          }
        }
      });

      setTimeout(async () => {
        if (!undone) {
          try {
            const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
            if (error) throw error;
          } catch (error: any) {
            // Restore on DB failure
            set((state: State) => ({
              expenses: [...state.expenses, snapshot]
            }));
            handleError(error, 'Failed to delete expense');
          }
        }
      }, 4500);
    } catch (error: any) {
      handleError(error, 'Failed to delete expense');
      throw error;
    }
  },

  bulkDeleteExpenses: async (ids: string[]) => {
    try {
      // Save snapshots for undo
      const snapshots = get().expenses.filter((exp) => ids.includes(exp.id));
      if (snapshots.length === 0) return;

      // Optimistically remove from state
      set((state: State) => ({
        expenses: state.expenses.filter((exp) => !ids.includes(exp.id))
      }));

      let undone = false;

      toast(`${ids.length} expense${ids.length > 1 ? 's' : ''} deleted`, {
        duration: 4000,
        action: {
          label: 'Undo',
          onClick: () => {
            undone = true;
            set((state: State) => ({
              expenses: [...state.expenses, ...snapshots].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )
            }));
          }
        }
      });

      setTimeout(async () => {
        if (!undone) {
          try {
            const { error } = await supabaseClient.from('expenses').delete().in('id', ids);
            if (error) throw error;
          } catch (error: any) {
            // Restore on DB failure
            set((state: State) => ({
              expenses: [...state.expenses, ...snapshots]
            }));
            handleError(error, 'Failed to delete expenses');
          }
        }
      }, 4500);
    } catch (error: any) {
      handleError(error, 'Failed to delete expenses');
      throw error;
    }
  },

  bulkUpdateCategory: async (ids: string[], categoryId: string, subcategoryId: string) => {
    try {
      const { error } = await supabaseClient
        .from('expenses')
        .update({ category_id: categoryId, subcategory_id: subcategoryId })
        .in('id', ids);

      if (error) throw error;

      set((state: State) => ({
        expenses: state.expenses.map((exp) =>
          ids.includes(exp.id) ? { ...exp, categoryId, subcategoryId } : exp
        )
      }));

      toast.success(`${ids.length} expense${ids.length > 1 ? 's' : ''} re-categorized`);
    } catch (error: any) {
      handleError(error, 'Failed to re-categorize expenses');
      throw error;
    }
  }
});
