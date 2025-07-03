
import { supabase } from '../supabase/client';
import { useExpenseStore } from '@/lib/store';

// Splitwise API base URL
const SPLITWISE_API_URL = 'https://secure.splitwise.com/api/v3.0';
const SPLITWISE_WRAPPER_URL = import.meta.env.VITE_SPLITWISE_WRAPPER_URL;

// Interface for Splitwise group
export interface SplitwiseGroup {
  id: number;
  name: string;
  group_type: string;
  members: SplitwiseGroupMember[];
}

// Interface for Splitwise group member
export interface SplitwiseGroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_status: string;
  picture: {
    small: string;
    medium: string;
    large: string;
  };
}

// Interface for creating a Splitwise expense
export interface CreateSplitwiseExpense {
  cost: string;
  description: string;
  date?: string; // Optional since the API will use current date if not provided
  group_id: number;
  users__0__user_id: string;
  users__0__paid_share: string;
  users__0__owed_share: string;
  [key: string]: string | number; // Allow dynamic user share properties
}

// Interface for Splitwise expense response
export interface SplitwiseExpenseResponse {
  expense: {
    id: number;
    group_id: number;
    description: string;
    payment: boolean;
    cost: string;
    date: string;
    created_at: string;
    currency_code: string;
    repayments: Record<string, unknown>[];
    users: Record<string, unknown>[];
  };
}

// Interface for Splitwise current user
export interface SplitwiseCurrentUser {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    registration_status: string;
    picture: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

// Interface for Splitwise user share in an expense
interface SplitwiseUserShare {
  user_id: number;
  paid_share: string;
  owed_share: string;
}

/**
 * Get the user's Splitwise API key from Supabase
 */
export const getSplitwiseApiKey = async (): Promise<{ apiKey: string | null; lastSyncTime: string | null; splitwiseUserId: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return { apiKey: null, lastSyncTime: null, splitwiseUserId: null };
    }

    console.log('Fetching Splitwise API key for user:', user.id);
    const { data, error } = await supabase
      .from('user_settings')
      .select('splitwise_api_key, last_sync_time, splitwise_user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
    
    console.log('User settings retrieved:', { 
      hasApiKey: !!data?.splitwise_api_key, 
      hasUserId: !!data?.splitwise_user_id,
      hasLastSyncTime: !!data?.last_sync_time
    });
    
    return { 
      apiKey: data?.splitwise_api_key || null,
      lastSyncTime: data?.last_sync_time || null,
      splitwiseUserId: data?.splitwise_user_id || null
    };
  } catch (error) {
    console.error('Error in getSplitwiseApiKey:', error);
    return { apiKey: null, lastSyncTime: null, splitwiseUserId: null };
  }
};

/**
 * Fetch user's Splitwise groups
 */
export const fetchSplitwiseGroups = async (): Promise<SplitwiseGroup[]> => {
  try {
    // First check if we have the API key
    const { apiKey } = await getSplitwiseApiKey();
    if (!apiKey) {
      console.error('No Splitwise API key found');
      throw new Error('No Splitwise API key found. Please set up your API key in the profile settings.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session found. Please log in again.');
    }

    console.log('Fetching Splitwise groups with auth token');
    const response = await fetch(`${SPLITWISE_WRAPPER_URL}/get_groups`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error response:', errorText);
      throw new Error(`Splitwise API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Splitwise groups fetched successfully:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching Splitwise groups:', error);
    throw error;
  }
};

/**
 * Create a new expense in Splitwise
 */
export const createSplitwiseExpense = async (expense: CreateSplitwiseExpense): Promise<SplitwiseExpenseResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found. Please log in again.');
    }

    // Extract group_id from the expense object
    const { group_id, ...expenseData } = expense;

    const response = await fetch(
      `${SPLITWISE_WRAPPER_URL}/create_expense?group_id=${group_id}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(expenseData)
      }
    );

    if (!response.ok) {
      throw new Error(`Splitwise API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Splitwise expense:', error);
    throw error;
  }
};

/**
 * Get the current user's Splitwise user ID
 */
export async function getCurrentSplitwiseUser(): Promise<number | null> {
  try {
    const { splitwiseUserId } = await getSplitwiseApiKey();
    if (!splitwiseUserId) return null;
    
    return parseInt(splitwiseUserId);
  } catch (error) {
    console.error('Error getting current Splitwise user:', error);
    return null;
  }
}

/**
 * Sync expenses from Splitwise
 */
export const syncSplitwiseExpenses = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found. Please log in again.');
    }

    const { lastSyncTime, splitwiseUserId } = await getSplitwiseApiKey();
    if (!splitwiseUserId) throw new Error('Splitwise user ID not found');

    // If no last sync time exists, we can't sync
    if (!lastSyncTime) {
      throw new Error('No previous sync time found. Please set up Splitwise integration first.');
    }

    // Use the last sync time directly in ISO format
    const afterDate = lastSyncTime;

    const response = await fetch(
      `${SPLITWISE_WRAPPER_URL}/get_expenses?after_date=${encodeURIComponent(afterDate)}&user_id=${splitwiseUserId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Splitwise API error: ${response.status}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { expenses } = await response.json();
    
    // Get the default category and subcategory for Splitwise expenses
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('type', 'misc')
      .limit(1)
      .single();
    
    if (!categories) throw new Error('No default category found for Splitwise expenses');
    
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', categories.id)
      .limit(1)
      .single();
    
    if (!subcategories) throw new Error('No default subcategory found for Splitwise expenses');

    // Add each expense to the database
    for (const expense of expenses) {
      // Skip payment transactions
      if (expense.payment) continue;

      // Find user's share in the expense
      const userShare = expense.users.find((u: SplitwiseUserShare) => u.user_id === parseInt(splitwiseUserId));
      if (!userShare || parseFloat(userShare.owed_share) <= 0) continue;

      // Add expense to database
      await supabase
        .from('expenses')
        .insert({
          amount: parseFloat(userShare.owed_share),
          description: expense.description,
          date: expense.date,
          category_id: categories.id,
          subcategory_id: subcategories.id,
          user_id: user.id
        });
    }

    // Update last sync time
    await supabase
      .from('user_settings')
      .update({ last_sync_time: new Date().toISOString() })
      .eq('user_id', user.id);

    // Refresh expenses in the store
    const store = useExpenseStore.getState();
    await store.fetchExpenses();
  } catch (error) {
    console.error('Error syncing Splitwise expenses:', error);
    throw error;
  }
};

/**
 * Get the current user's information from Splitwise
 */
export const getCurrentSplitwiseUserInfo = async (apiKey: string): Promise<{ id: number; first_name: string; last_name: string; email: string; registration_status: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found. Please log in again.');
    }

    console.log('Fetching current Splitwise user info');
    const response = await fetch(`${SPLITWISE_WRAPPER_URL}/get_current_user`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error response:', errorText);
      throw new Error(`Splitwise API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Splitwise current user fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Splitwise current user:', error);
    throw error;
  }
};
