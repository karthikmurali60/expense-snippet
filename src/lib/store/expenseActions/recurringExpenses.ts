
import { toast } from 'sonner';
import { addMonths, format, parseISO } from 'date-fns';
import { State, Store } from '../types';
import { handleError } from '../utils';

export const createRecurringExpenseActions = (set: any, get: () => Store) => ({
  addRecurringExpense: async (expense: any) => {
    try {
      const months = expense.recurring?.months ?? 0;
      const isRecurring = expense.recurring?.isRecurring;

      if (!isRecurring) {
        const result = await get().addExpense(expense);
        return result ? [result] : [];
      }

      // Indefinite: add only the current month instance
      if (months === 0) {
        const groupId = crypto.randomUUID();
        const baseDate = new Date(expense.date);
        const currentMonth = format(baseDate, 'yyyy-MM');
        const result = await get().addExpense({
          ...expense,
          recurring: {
            ...expense.recurring,
            startMonth: currentMonth,
            groupId
          }
        });
        return result ? [result] : [];
      }

      // Bounded: add one expense per month
      const groupId = crypto.randomUUID();
      const results: any[] = [];
      const baseDate = new Date(expense.date);
      const startMonth = format(baseDate, 'yyyy-MM');

      for (let i = 0; i < months; i++) {
        const currentDate = addMonths(baseDate, i);
        const monthExpense = {
          ...expense,
          date: currentDate,
          recurring: {
            ...expense.recurring,
            startMonth,
            groupId
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

  autoGenerateRecurringExpenses: async () => {
    try {
      const allExpenses = get().expenses;
      const recurringExpenses = allExpenses.filter((e) => e.recurring?.isRecurring);

      if (recurringExpenses.length === 0) return;

      const today = new Date();
      const currentMonth = format(today, 'yyyy-MM');

      // Group by groupId or fallback key
      const groups = new Map<string, typeof recurringExpenses>();
      for (const expense of recurringExpenses) {
        const key =
          expense.recurring!.groupId ||
          `${expense.recurring!.startMonth}-${expense.description}-${expense.amount}-${expense.categoryId}`;
        const group = groups.get(key) || [];
        group.push(expense);
        groups.set(key, group);
      }

      const toAdd: Array<Omit<(typeof recurringExpenses)[0], 'id'>> = [];

      for (const [, group] of groups) {
        // Sort by date ascending; first entry is the template
        const sorted = [...group].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const template = sorted[0];
        const { months, startMonth, groupId } = template.recurring!;

        // Build the set of months that already exist
        const existingMonths = new Set(
          group.map((e) => format(new Date(e.date), 'yyyy-MM'))
        );

        // Determine which months should exist
        const expectedMonths: string[] = [];
        const start = parseISO(`${startMonth}-01`);

        if (months === 0) {
          // Indefinite: from startMonth up to and including currentMonth
          let cursor = start;
          while (format(cursor, 'yyyy-MM') <= currentMonth) {
            expectedMonths.push(format(cursor, 'yyyy-MM'));
            cursor = addMonths(cursor, 1);
          }
        } else {
          // Bounded: all N months whose date <= today
          for (let i = 0; i < months; i++) {
            const monthDate = addMonths(start, i);
            if (monthDate <= today) {
              expectedMonths.push(format(monthDate, 'yyyy-MM'));
            }
          }
        }

        // Find missing months
        for (const month of expectedMonths) {
          if (!existingMonths.has(month)) {
            const missingDate = parseISO(`${month}-${format(new Date(template.date), 'dd')}`);
            toAdd.push({
              ...template,
              date: missingDate,
              recurring: {
                ...template.recurring!,
                startMonth,
                groupId
              }
            });
          }
        }
      }

      if (toAdd.length === 0) return;

      for (const expense of toAdd) {
        await get().addExpense(expense);
      }

      toast.success(`Auto-generated ${toAdd.length} recurring expense${toAdd.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('Failed to auto-generate recurring expenses:', error);
    }
  }
});
