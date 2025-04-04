
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface RecurringExpenseOptionProps {
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurringMonthsInput: string;
  setRecurringMonthsInput: (months: string) => void;
  isEditing: boolean;
}

const RecurringExpenseOption: React.FC<RecurringExpenseOptionProps> = ({ 
  isRecurring, 
  setIsRecurring, 
  recurringMonthsInput, 
  setRecurringMonthsInput,
  isEditing
}) => {
  if (isEditing) return null;
  
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="recurring-switch" className="text-sm font-medium text-foreground">
          Recurring Expense
        </Label>
        <Switch 
          id="recurring-switch" 
          checked={isRecurring} 
          onCheckedChange={setIsRecurring}
        />
      </div>
      
      {isRecurring && (
        <div className="mt-4">
          <Label htmlFor="recurring-months" className="text-sm text-muted-foreground">
            Repeat for
          </Label>
          <div className="flex items-center mt-1">
            <Input
              id="recurring-months"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={recurringMonthsInput}
              onChange={(e) => setRecurringMonthsInput(e.target.value)}
              className="w-20 mr-2"
            />
            <span className="text-sm text-muted-foreground">months</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will create {recurringMonthsInput} expenses, one for each month starting from the selected date.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseOption;
