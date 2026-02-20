import React from 'react';
import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  isSubmitting: boolean;
  isEditing: boolean;
  isRecurring: boolean;
  recurringMonths: number;
  initialized: boolean;
  isIndefinite?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting,
  isEditing,
  isRecurring,
  recurringMonths,
  initialized,
  isIndefinite = false,
}) => {
  const getLabel = () => {
    if (isSubmitting) return 'Saving...';
    if (isEditing) return 'Update Expense';
    if (isRecurring) {
      if (isIndefinite) return 'Add Indefinite Recurring Expense';
      return `Add Recurring Expense (${recurringMonths} months)`;
    }
    return 'Add Expense';
  };

  return (
    <Button
      type="submit"
      className="w-full"
      size="lg"
      disabled={isSubmitting || !initialized}
    >
      {getLabel()}
    </Button>
  );
};

export default SubmitButton;
