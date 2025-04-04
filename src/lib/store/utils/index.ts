
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export { convertToCategory, convertToSubCategory, convertToExpense, convertToBudget, convertToSavingsGoal } from './converters';

// Export supabase client for convenience
export const supabaseClient = supabase;

// Common error handler
export const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast.error(message);
  return null;
};
