import { z } from 'zod';
import type { CategoryType } from './types';

const categoryTypeEnum = z.enum(['car', 'groceries', 'home', 'food', 'misc'] as const);

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  type: categoryTypeEnum,
  icon: z.string().optional()
});

export const subcategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  categoryId: z.string().uuid('Invalid category ID')
});

export const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  date: z.date(),
  categoryId: z.string().uuid('Invalid category ID'),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  recurring: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    endDate: z.date().optional(),
    lastProcessed: z.date().optional()
  }).optional()
});

export const budgetSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
  categoryId: z.string().uuid('Invalid category ID')
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative'),
  deadline: z.date().optional()
}); 