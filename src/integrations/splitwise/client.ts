
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
      hasLastSyncTime: !!data?.last_sync_time,
      splitwiseUserId: data?.splitwise_user_id
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

    console.log('Creating Splitwise expense:', expenseData, 'for group:', group_id);

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
      const errorText = await response.text();
      console.error('Splitwise expense creation error:', errorText);
      throw new Error(`Splitwise API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Splitwise expense created successfully:', result);
    return result;
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
    console.log('Getting current Splitwise user...');
    const { splitwiseUserId } = await getSplitwiseApiKey();
    
    if (!splitwiseUserId) {
      console.log('No Splitwise user ID found in database, attempting to fetch from API...');
      
      // Try to fetch from Splitwise API and update the database
      try {
        const userInfo = await getCurrentSplitwiseUserInfo();
        console.log('Fetched user info from Splitwise API:', userInfo);
        
        // Update the database with the fetched user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (user && userInfo.id) {
          await supabase
            .from('user_settings')
            .update({ splitwise_user_id: userInfo.id.toString() })
            .eq('user_id', user.id);
          
          console.log('Updated database with Splitwise user ID:', userInfo.id);
          return userInfo.id;
        }
      } catch (apiError) {
        console.error('Failed to fetch user info from Splitwise API:', apiError);
        throw new Error('Unable to fetch Splitwise user ID. Please check your API key.');
      }
      
      return null;
    }
    
    const userId = parseInt(splitwiseUserId);
    console.log('Current Splitwise user ID from database:', userId);
    return userId;
  } catch (error) {
    console.error('Error getting current Splitwise user:', error);
    throw error;
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

    // If no last sync time exists, use a date far in the past
    const afterDate = lastSyncTime || '2020-01-01T00:00:00.000Z';
    console.log('Syncing expenses after:', afterDate);

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
      const errorText = await response.text();
      console.error('Splitwise sync error:', errorText);
      throw new Error(`Splitwise API error: ${response.status} - ${errorText}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { expenses } = await response.json();
    console.log('Fetched expenses from Splitwise:', expenses?.length || 0);
    
    // Get the default category and subcategory for Splitwise expenses
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('type', 'misc')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (!categories) {
      console.error('No misc category found, creating one...');
      // Create a default misc category if none exists
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          name: 'Miscellaneous',
          type: 'misc',
          icon: 'Package',
          user_id: user.id
        })
        .select('id')
        .single();
      
      if (!newCategory) throw new Error('Failed to create default category');
      categories.id = newCategory.id;
    }
    
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', categories.id)
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (!subcategories) {
      console.error('No subcategory found, creating one...');
      // Create a default subcategory if none exists
      const { data: newSubcategory } = await supabase
        .from('subcategories')
        .insert({
          name: 'Splitwise',
          category_id: categories.id,
          user_id: user.id
        })
        .select('id')
        .single();
        
      if (!newSubcategory) throw new Error('Failed to create default subcategory');
      subcategories.id = newSubcategory.id;
    }

    // Add each expense to the database
    let addedCount = 0;
    if (expenses && expenses.length > 0) {
      for (const expense of expenses) {
        // Skip payment transactions
        if (expense.payment) continue;

        // Find user's share in the expense
        const userShare = expense.users.find((u: SplitwiseUserShare) => u.user_id === parseInt(splitwiseUserId));
        if (!userShare || parseFloat(userShare.owed_share) <= 0) continue;

        try {
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
          addedCount++;
        } catch (insertError) {
          console.error('Error inserting expense:', insertError);
          // Continue with other expenses even if one fails
        }
      }
    }

    // Update last sync time
    await supabase
      .from('user_settings')
      .update({ last_sync_time: new Date().toISOString() })
      .eq('user_id', user.id);

    console.log(`Sync completed: ${addedCount} expenses added`);

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
export const getCurrentSplitwiseUserInfo = async (): Promise<SplitwiseCurrentUser> => {
  try {
    const { apiKey } = await getSplitwiseApiKey();
    if (!apiKey) {
      throw new Error('No Splitwise API key found. Please set up your API key in the profile settings.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found. Please log in again.');
    }

    console.log('Fetching current Splitwise user info with API key');
    const response = await fetch(`${SPLITWISE_WRAPPER_URL}/get_current_user`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error response:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Splitwise API key. Please check your API key in profile settings.');
      } else if (response.status === 403) {
        throw new Error('Splitwise API access forbidden. Please verify your API key permissions.');
      } else {
        throw new Error(`Splitwise API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Splitwise current user fetched successfully:', data);
    
    if (!data || !data.user || !data.user.id) {
      throw new Error('Invalid response from Splitwise API. User data not found.');
    }
    
    return data.user;
  } catch (error) {
    console.error('Error fetching Splitwise current user:', error);
    throw error;
  }
};
