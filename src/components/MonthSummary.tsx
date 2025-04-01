
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getMonthName } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';

interface MonthSummaryProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  totalAmount: number;
  categoryBreakdown: Array<{
    id: string;
    total: number;
    color: string;
  }>;
}

const MonthSummary: React.FC<MonthSummaryProps> = ({
  selectedMonth,
  setSelectedMonth,
  totalAmount,
  categoryBreakdown
}) => {
  return (
    <>
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onChange={setSelectedMonth} 
      />
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5 mb-6"
      >
        <p className="text-sm font-medium text-muted-foreground">Total for {getMonthName(selectedMonth)}</p>
        <h2 className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</h2>
        
        <div className="h-8 rounded-full bg-secondary overflow-hidden mt-4">
          <div className="flex h-full">
            {categoryBreakdown.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(category.total / totalAmount) * 100}%` 
                }}
                transition={{ delay: 0.2 + (index * 0.1), duration: 0.5 }}
                className={`h-full ${category.total > 0 ? `bg-${category.color}` : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default MonthSummary;
