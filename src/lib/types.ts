
export type CategoryType = 'car' | 'groceries' | 'home' | 'food' | 'misc';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface RecurringExpenseDetails {
  isRecurring: boolean;
  months: number;          // Number of months to repeat
  startMonth: string;      // Format: 'YYYY-MM'
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  subcategoryId: string;
  recurring?: RecurringExpenseDetails;
}

export interface MonthlyStatistics {
  month: string; // Format: 'YYYY-MM'
  categories: {
    [categoryId: string]: number;
  };
  total: number;
}

export interface Budget {
  id: string;
  amount: number;
  month: string; // Format: 'YYYY-MM'
  categoryId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: Date;
  icon: string;
  color: string;
}
