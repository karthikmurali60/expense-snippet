
import React from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface AmountInputProps {
  amount: number;
  setAmount: (amount: number) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({ amount, setAmount }) => {
  const isMobile = useMobile();
  
  return (
    <div className="glass rounded-xl p-5">
      <label className="text-sm font-medium text-foreground mb-2 block">
        Amount
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={amount === 0 ? '' : amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          step="0.01"
          className="w-full rounded-lg border border-input bg-background px-8 py-2 text-right text-xl font-semibold"
          autoFocus={!isMobile}
        />
      </div>
    </div>
  );
};

export default AmountInput;
