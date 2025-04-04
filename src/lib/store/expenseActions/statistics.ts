
import { format } from 'date-fns';
import { State, Store } from '../types';

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
        color: category.type === 'food' ? 'green-500' : 
               category.type === 'home' ? 'blue-500' : 
               category.type === 'car' ? 'red-500' : 
               category.type === 'groceries' ? 'yellow-500' : 'purple-500'
      };
    }).sort((a, b) => b.total - a.total);
    
    return { totalAmount, categoryBreakdown };
  }
});
