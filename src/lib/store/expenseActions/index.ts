
import { State, Store, ExpenseActions } from '../types';
import { createFetchExpensesAction } from './fetchExpenses';
import { createAddExpenseActions } from './addExpense';
import { createRecurringExpenseActions } from './recurringExpenses';
import { createUpdateDeleteExpenseActions } from './updateDeleteExpense';
import { createStatisticsActions } from './statistics';

export const expenseActions = (set: any, get: () => Store): ExpenseActions => ({
  ...createFetchExpensesAction(set, get),
  ...createAddExpenseActions(set, get),
  ...createRecurringExpenseActions(set, get),
  ...createUpdateDeleteExpenseActions(set, get),
  ...createStatisticsActions(set, get)
});
