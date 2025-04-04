
import React from 'react';
import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  isSubmitting: boolean;
  isEditing: boolean;
  isRecurring: boolean;
  recurringMonths: number;
  initialized: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  isSubmitting, 
  isEditing, 
  isRecurring, 
  recurringMonths,
  initialized
}) => {
  return (
    <Button 
      type="submit" 
      className="w-full" 
      size="lg"
      disabled={isSubmitting || !initialized}
    >
      {isSubmitting 
        ? 'Saving...' 
        : isEditing 
          ? 'Update Expense' 
          : isRecurring
            ? `Add Recurring Expense (${recurringMonths} months)`
            : 'Add Expense'
      }
    </Button>
  );
};

export default SubmitButton;
