
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Mail, Key, LogOut, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [splitwiseApiKey, setSplitwiseApiKey] = useState('');
  const [splitwiseUserId, setSplitwiseUserId] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Fetch user settings including Splitwise API key and last sync time
        if (user) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('splitwise_api_key, splitwise_user_id, last_sync_time')
            .eq('user_id', user.id)
            .single();
            
          if (data && !error) {
            setSplitwiseApiKey(data.splitwise_api_key || '');
            setSplitwiseUserId(data.splitwise_user_id || '');
            setLastSyncTime(data.last_sync_time || null);
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!user) return;
    
    setIsSavingApiKey(true);
    try {
      // Check if a record already exists
      const { data: existingData } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let operation;
      
      if (existingData) {
        // Update existing record
        operation = supabase
          .from('user_settings')
          .update({
            splitwise_api_key: splitwiseApiKey,
            splitwise_user_id: splitwiseUserId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new record
        operation = supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            splitwise_api_key: splitwiseApiKey,
            splitwise_user_id: splitwiseUserId,
            updated_at: new Date().toISOString()
          });
      }
      
      const { error } = await operation;
      
      if (error) throw error;
      toast.success('Splitwise settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 space-y-6"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user?.email}</h2>
            <p className="text-sm text-muted-foreground">Account created {new Date(user?.created_at || '').toLocaleDateString()}</p>
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
                  Enter your Splitwise API key to enable expense synchronization
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="splitwiseUserId">
                  Splitwise User ID
                </label>
                <p className="text-sm text-muted-foreground">
                  Enter your Splitwise User ID to identify your account
                </p>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="splitwiseUserId"
                    type="text"
                    value={splitwiseUserId}
                    onChange={(e) => setSplitwiseUserId(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your Splitwise User ID"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={isSavingApiKey}
              >
                {isSavingApiKey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save API Key'
                )}
              </Button>
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
      </motion.div>
    </Layout>
  );
};

export default Profile;
