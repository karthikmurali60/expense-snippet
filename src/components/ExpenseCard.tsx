
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
import { toast } from 'sonner';
import { useExpenseStore } from '@/lib/store';

interface ExpenseCardProps {
  expense: Expense;
  category: Category;
  subcategory: Subcategory;
  onEdit: (expense: Expense) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  category,
  subcategory,
  onEdit,
}) => {
  const { deleteExpense } = useExpenseStore();

  const handleDelete = async (id: string) => {
    try {
      if (confirm('Are you sure you want to delete this expense?')) {
        await deleteExpense(id);
        toast.success('Expense deleted successfully');
      }
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense: ' + error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl p-4 mb-3 relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-2 p-1 rounded-full hover:bg-secondary transition-colors">
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
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseCard;
