
import React from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MonthSelectorProps {
  selectedMonth: string; // Format: 'YYYY-MM'
  onChange: (month: string) => void;
  isDateRangeActive?: boolean;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ 
  selectedMonth, 
  onChange,
  isDateRangeActive = false 
}) => {
  const monthDate = parseISO(`${selectedMonth}-01`);
  
  const goToPreviousMonth = () => {
    const newDate = subMonths(monthDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };
  
  const goToNextMonth = () => {
    const newDate = addMonths(monthDate, 1);
    onChange(format(newDate, 'yyyy-MM'));
  };
  
  return (
    <div className="flex items-center justify-between mb-6 relative">
      <button 
        onClick={goToPreviousMonth}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <motion.div 
        key={selectedMonth}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-xl font-medium text-center flex flex-col"
      >
        <span>{format(monthDate, 'MMMM yyyy')}</span>
        {isDateRangeActive && (
          <span className="text-xs text-muted-foreground mt-1">
            Month view (date range filter active)
          </span>
        )}
      </motion.div>
      
      <button 
        onClick={goToNextMonth}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MonthSelector;
