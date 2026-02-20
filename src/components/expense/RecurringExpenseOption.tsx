import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface RecurringExpenseOptionProps {
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurringMonthsInput: string;
  setRecurringMonthsInput: (months: string) => void;
  isEditing: boolean;
  isIndefinite: boolean;
  setIsIndefinite: (v: boolean) => void;
}

const RecurringExpenseOption: React.FC<RecurringExpenseOptionProps> = ({
  isRecurring,
  setIsRecurring,
  recurringMonthsInput,
  setRecurringMonthsInput,
  isEditing,
  isIndefinite,
  setIsIndefinite,
}) => {
  if (isEditing) return null;

  const handleIndefiniteChange = (checked: boolean) => {
    setIsIndefinite(checked);
    if (checked) {
      setRecurringMonthsInput('0');
    } else {
      setRecurringMonthsInput('3');
    }
  };

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
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="indefinite-checkbox"
              checked={isIndefinite}
              onCheckedChange={(checked) => handleIndefiniteChange(!!checked)}
            />
            <Label htmlFor="indefinite-checkbox" className="text-sm text-muted-foreground cursor-pointer">
              Repeat indefinitely
            </Label>
          </div>

          {!isIndefinite && (
            <div>
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

          {isIndefinite && (
            <p className="text-xs text-muted-foreground">
              One expense will be created now. Future months will be auto-generated on startup.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseOption;
