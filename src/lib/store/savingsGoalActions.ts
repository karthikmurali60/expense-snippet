
import { toast } from 'sonner';
import { SavingsGoalActions, State, Store } from './types';
import { convertToSavingsGoal, supabaseClient, handleError } from './utils';

export const savingsGoalActions = (set: any, get: () => Store): SavingsGoalActions => ({
  addSavingsGoal: async (goal) => {
    try {
      const user = (await supabaseClient.auth.getUser()).data.user;
      if (!user) throw new Error('You must be logged in to add savings goals');

      const { data, error } = await supabaseClient
        .from('savings_goals')
        .insert({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          due_date: goal.dueDate ? goal.dueDate.toISOString() : null,
          icon: goal.icon,
          color: goal.color,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newGoal = convertToSavingsGoal(data);
        set((state: State) => ({
          savingsGoals: [...state.savingsGoals, newGoal]
        }));
        return newGoal;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to add savings goal');
    }
  },
  
  updateSavingsGoal: async (id, updates) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;

      const { data, error } = await supabaseClient
        .from('savings_goals')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedGoal = convertToSavingsGoal(data);
        set((state: State) => ({
          savingsGoals: state.savingsGoals.map((goal) => (goal.id === id ? updatedGoal : goal))
        }));
        return updatedGoal;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to update savings goal');
    }
  },
  
  deleteSavingsGoal: async (id) => {
    try {
      const { error } = await supabaseClient.from('savings_goals').delete().eq('id', id);

      if (error) throw error;

      set((state: State) => ({
        savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id)
      }));
      
      toast.success('Savings goal deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete savings goal');
      throw error;
    }
  }
});
