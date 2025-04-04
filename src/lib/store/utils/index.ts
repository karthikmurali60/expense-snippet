
export * from './converters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Supabase client
export const supabaseClient = supabase;

// Error handling utility
export const handleError = (error: any, message: string): null => {
  console.error(`${message}:`, error);
  toast.error(`${message}: ${error.message}`);
  return null;
};
