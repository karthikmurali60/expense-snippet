import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SplitwiseMember {
  id: number;
  first_name: string;
  last_name: string;
}

interface SplitwiseMemberSelectionProps {
  groupId: number | null;
  selectedMembers: number[];
  onMemberSelectionChange: (memberIds: number[]) => void;
}

const SplitwiseMemberSelection: React.FC<SplitwiseMemberSelectionProps> = ({
  groupId,
  selectedMembers,
  onMemberSelectionChange,
}) => {
  const [members, setMembers] = useState<SplitwiseMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!groupId) {
        setMembers([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SPLITWISE_WRAPPER_URL}/get_group_info?group_id=${groupId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch group members');
        }

        const data = await response.json();
        setMembers(data.users);
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupMembers();
  }, [groupId]);

  const toggleMember = (memberId: number) => {
    const newSelectedMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    onMemberSelectionChange(newSelectedMembers);
  };

  if (!groupId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Members</label>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <Badge
            key={member.id}
            variant={selectedMembers.includes(member.id) ? "default" : "outline"}
            className="cursor-pointer hover:opacity-80"
            onClick={() => toggleMember(member.id)}
          >
            {member.first_name} {member.last_name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SplitwiseMemberSelection; 