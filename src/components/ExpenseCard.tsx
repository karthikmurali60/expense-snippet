import React from 'react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Category, Subcategory, Expense } from '@/lib/types';
import { motion } from 'framer-motion';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useExpenseStore } from '@/lib/store';

interface ExpenseCardProps {
  expense: Expense;
  category: Category;
  subcategory: Subcategory;
  onEdit: (expense: Expense) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  category,
  subcategory,
  onEdit,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const { deleteExpense } = useExpenseStore();

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense: ' + error.message);
    }
  };

  const handleCardClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(expense.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'glass rounded-xl p-4 mb-3 relative overflow-hidden',
        isSelectMode && 'cursor-pointer',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start">
        {isSelectMode && (
          <div className="flex items-center mr-3 mt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(expense.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="text-sm text-muted-foreground">
            {formatDate(expense.date)}
          </div>
          <div className="font-medium mt-1">{expense.description}</div>
          <div className="flex gap-2 mt-2">
            <span className={cn('px-2 py-0.5 text-xs rounded-md', `bg-expense-${category.type} text-white/90`)}>
              {category.name}
            </span>
            <span className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground">
              {subcategory.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-lg font-semibold">
            {formatCurrency(expense.amount)}
          </div>

          {!isSelectMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="mt-2 p-1 rounded-full hover:bg-secondary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(expense.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseCard;
