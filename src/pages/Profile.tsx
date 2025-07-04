import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Mail, Key, LogOut, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { getCurrentSplitwiseUserInfo, syncSplitwiseExpenses } from '@/integrations/splitwise/client';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingUserId, setIsFetchingUserId] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [splitwiseApiKey, setSplitwiseApiKey] = useState('');
  const [splitwiseUserId, setSplitwiseUserId] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Fetch user settings including Splitwise API key and last sync time
        if (user) {
          console.log('Fetching user settings for user:', user.id);
          const { data, error } = await supabase
            .from('user_settings')
            .select('splitwise_api_key, splitwise_user_id, last_sync_time')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching user settings:', error);
          } else if (data) {
            console.log('User settings found:', { hasApiKey: !!data.splitwise_api_key, hasUserId: !!data.splitwise_user_id });
            setSplitwiseApiKey(data.splitwise_api_key || '');
            setSplitwiseUserId(data.splitwise_user_id || '');
            setLastSyncTime(data.last_sync_time || null);
          } else {
            console.log('No user settings found');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // Function to fetch Splitwise user ID when API key changes
  const fetchSplitwiseUserId = async (apiKey: string, forceRefresh: boolean = false) => {
    if (!apiKey.trim() && !forceRefresh) {
      setSplitwiseUserId('');
      return;
    }

    if (!forceRefresh && splitwiseUserId) {
      return; // Don't refetch if we already have a user ID
    }

    setIsFetchingUserId(true);
    try {
      console.log('Fetching Splitwise user ID with API key');
      const userInfo = await getCurrentSplitwiseUserInfo();
      console.log('Splitwise user info:', userInfo);
      setSplitwiseUserId(userInfo.id.toString());
    } catch (error: unknown) {
      console.error('Error fetching Splitwise user ID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to fetch Splitwise user ID: ${errorMessage}`);
      if (!forceRefresh) {
        setSplitwiseUserId('');
      }
    } finally {
      setIsFetchingUserId(false);
    }
  };

  // Update Splitwise user ID when API key changes
  useEffect(() => {
    if (!splitwiseApiKey.trim()) return;
    
    const debounceTimer = setTimeout(() => {
      fetchSplitwiseUserId(splitwiseApiKey);
    }, 1000); // Increased debounce time

    return () => clearTimeout(debounceTimer);
  }, [splitwiseApiKey]);

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!user) {
      toast.error('You must be logged in to save API keys');
      return;
    }
    
    if (!splitwiseApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    if (!splitwiseUserId) {
      toast.error('Unable to verify Splitwise user ID. Please check your API key.');
      return;
    }
    
    setIsSavingApiKey(true);
    try {
      console.log('Saving Splitwise API key for user:', user.id);
      
      // Check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing settings:', checkError);
        throw new Error(`Failed to check for existing settings: ${checkError.message}`);
      }
      
      console.log('Existing settings record:', existingData ? 'Found' : 'Not found');
      
      let result;
      const now = new Date().toISOString();
      
      if (existingData) {
        console.log('Updating existing user settings record');
        result = await supabase
          .from('user_settings')
          .update({
            splitwise_api_key: splitwiseApiKey.trim(),
            splitwise_user_id: splitwiseUserId,
            last_sync_time: now,
            updated_at: now
          })
          .eq('user_id', user.id);
          
        console.log('Update result:', result);
      } else {
        console.log('Creating new user settings record');
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            splitwise_api_key: splitwiseApiKey.trim(),
            splitwise_user_id: splitwiseUserId,
            last_sync_time: now,
            created_at: now,
            updated_at: now
          });
          
        console.log('Insert result:', result);
      }
      
      if (result.error) {
        console.error('Error saving settings:', result.error);
        throw result.error;
      }
      
      setLastSyncTime(now);
      console.log('Settings saved successfully');
      toast.success('Splitwise settings saved successfully');
    } catch (error: unknown) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleRefreshUserId = async () => {
    if (!splitwiseApiKey.trim()) {
      toast.error('Please enter your Splitwise API key first');
      return;
    }
    
    await fetchSplitwiseUserId(splitwiseApiKey, true);
  };

  const handleSyncSplitwiseExpenses = async () => {
    if (!splitwiseApiKey.trim() || !splitwiseUserId) {
      toast.error('Please save your Splitwise API key first');
      return;
    }

    setIsSyncing(true);
    try {
      await syncSplitwiseExpenses();
      toast.success('Splitwise expenses synced successfully');
      
      // Refresh the last sync time
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('last_sync_time')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setLastSyncTime(data.last_sync_time);
        }
      }
    } catch (error: unknown) {
      console.error('Error syncing Splitwise expenses:', error);
      toast.error('Failed to sync expenses: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      toast.error('Error signing out: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
        
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary">
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user?.email}</h2>
              {user?.created_at && (
                <p className="text-sm text-muted-foreground">Account created {new Date(user.created_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdating || !newPassword || !confirmPassword}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Splitwise Integration</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="splitwiseApiKey">
                    Splitwise API Key
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Enter your Splitwise API key to enable expense synchronization.{' '}
                    <a 
                      href="https://secure.splitwise.com/apps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Get your API key here
                    </a>
                  </p>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="splitwiseApiKey"
                      type="password"
                      value={splitwiseApiKey}
                      onChange={(e) => setSplitwiseApiKey(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your Splitwise API key"
                    />
                  </div>
                  {splitwiseUserId && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600">
                        ✓ Connected to Splitwise User ID: {splitwiseUserId}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshUserId}
                        disabled={isFetchingUserId}
                      >
                        {isFetchingUserId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                  {isFetchingUserId && (
                    <p className="text-xs text-muted-foreground">
                      Verifying Splitwise connection...
                    </p>
                  )}
                  {lastSyncTime && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(lastSyncTime).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={isSavingApiKey || !splitwiseApiKey.trim() || !splitwiseUserId}
                    className="flex-1"
                  >
                    {isSavingApiKey ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleSyncSplitwiseExpenses}
                    disabled={isSyncing || !splitwiseApiKey.trim() || !splitwiseUserId}
                    variant="outline"
                    className="flex-1"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Expenses'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
