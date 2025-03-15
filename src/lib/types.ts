
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

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  subcategoryId: string;
}

export interface MonthlyStatistics {
  month: string; // Format: 'YYYY-MM'
  categories: {
    [categoryId: string]: number;
  };
  total: number;
}
