import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { fetchSplitwiseGroups, SplitwiseGroup } from '@/integrations/splitwise/client';
import { toast } from 'sonner';
import SplitwiseMemberSelection from './SplitwiseMemberSelection';

interface SplitwiseIntegrationProps {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  selectedGroupId: number | null;
  setSelectedGroupId: (groupId: number | null) => void;
  selectedMemberIds: number[];
  setSelectedMemberIds: (memberIds: number[]) => void;
  amount: number;
}

const SplitwiseIntegration: React.FC<SplitwiseIntegrationProps> = ({
  isEnabled,
  setIsEnabled,
  selectedGroupId,
  setSelectedGroupId,
  selectedMemberIds,
  setSelectedMemberIds,
  amount
}) => {
  const [groups, setGroups] = useState<SplitwiseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      if (isEnabled) {
        setIsLoading(true);
        try {
          console.log('Fetching Splitwise groups...');
          const fetchedGroups = await fetchSplitwiseGroups();
          console.log('Fetched groups:', fetchedGroups);
          setGroups(fetchedGroups);
          
          // Auto-select the first group if none is selected
          if (fetchedGroups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(fetchedGroups[0].id);
          }
        } catch (error) {
          console.error('Error loading Splitwise groups:', error);
          toast.error('Failed to load Splitwise groups. Please make sure you are logged in and have set up your Splitwise API key in settings.');
          setIsEnabled(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGroups();
  }, [isEnabled, selectedGroupId, setSelectedGroupId, setIsEnabled]);

  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked);
    if (!checked) {
      setSelectedGroupId(null);
      setSelectedMemberIds([]);
    }
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="splitwise-switch" className="text-sm font-medium text-foreground">
          Add to Splitwise
        </Label>
        <Switch 
          id="splitwise-switch" 
          checked={isEnabled} 
          onCheckedChange={handleToggleChange}
        />
      </div>
      
      {isEnabled && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading groups...</span>
            </div>
          ) : groups.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="splitwise-group" className="text-sm text-muted-foreground">
                  Select Group
                </Label>
                <Select
                  value={selectedGroupId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedGroupId(value ? parseInt(value) : null);
                    setSelectedMemberIds([]); // Reset selected members when group changes
                  }}
                >
                  <SelectTrigger id="splitwise-group">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <SplitwiseMemberSelection
                groupId={selectedGroupId}
                selectedMembers={selectedMemberIds}
                onMemberSelectionChange={setSelectedMemberIds}
              />

              <p className="text-xs text-muted-foreground">
                This expense will be split equally among selected members with the amount of ${amount.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Splitwise groups found. Please check your API key in settings.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SplitwiseIntegration;
