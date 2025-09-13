
import { format, isWithinInterval } from 'date-fns';
import { State, Store } from '../types';
import { DateRange } from 'react-day-picker';

export const createStatisticsActions = (set: any, get: () => Store) => ({
  getMonthlyExpenses: (month: string) => {
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

  getExpensesByDateRange: (dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) {
      return [];
    }

    const expenses = get().expenses;
    return expenses.filter(expense => {
      // Check if expense.date is a Date object
      if (!(expense.date instanceof Date)) {
        console.error('Invalid date object:', expense);
        return false;
      }

      try {
        // If only from date is selected, check if expense date is on that day
        if (!dateRange.to) {
          return format(expense.date, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
        }

        // Check if expense date is within the date range
        return isWithinInterval(expense.date, {
          start: dateRange.from,
          end: dateRange.to
        });
      } catch (error) {
        console.error('Error processing date:', error, expense);
        return false;
      }
    });
  },

  getDateRangeStatistics: (dateRange: DateRange | undefined) => {
    // Directly implement the filtering logic here instead of calling getExpensesByDateRange
    let rangeExpenses = [];

    if (dateRange?.from) {
      const expenses = get().expenses;
      rangeExpenses = expenses.filter(expense => {
        // Check if expense.date is a Date object
        if (!(expense.date instanceof Date)) {
          console.error('Invalid date object:', expense);
          return false;
        }

        try {
          // If only from date is selected, check if expense date is on that day
          if (!dateRange.to) {
            return format(expense.date, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
          }

          // Check if expense date is within the date range
          return isWithinInterval(expense.date, {
            start: dateRange.from,
            end: dateRange.to
          });
        } catch (error) {
          console.error('Error processing date:', error, expense);
          return false;
        }
      });
    }

    const categories = get().categories;

    // Calculate total amount
    const totalAmount = rangeExpenses.reduce((total, expense) => total + expense.amount, 0);

    // Calculate breakdown by category
    const categoryTotals = rangeExpenses.reduce((acc, expense) => {
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
        color: category.type === 'food' ? 'red-500' :
          category.type === 'home' ? 'orange-500' :
            category.type === 'car' ? 'blue-500' :
              category.type === 'groceries' ? 'green-500' :
                category.type === 'misc' ? 'purple-500' : 'pink-500'
      };
    }).sort((a, b) => Number(b.total) - Number(a.total));

    return { totalAmount, categoryBreakdown };
  },

  getMonthlyStatistics: (month: string) => {
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
        color: category.type === 'food' ? 'red-500' :
          category.type === 'home' ? 'orange-500' :
            category.type === 'car' ? 'blue-500' :
              category.type === 'groceries' ? 'green-500' :
                category.type === 'misc' ? 'purple-500' : 'pink-500'
      };
    }).sort((a, b) => Number(b.total) - Number(a.total));

    return { totalAmount, categoryBreakdown };
  }
});
