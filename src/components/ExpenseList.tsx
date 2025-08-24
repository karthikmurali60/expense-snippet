
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import ExpenseCard from '@/components/ExpenseCard';
import { Category, Subcategory, Expense } from '@/lib/types';

interface ExpenseListProps {
  isLoading: boolean;
  filteredExpenses: Expense[];
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategories: string[];
  selectedSubcategory: string | null;
  handleAddExpense: () => void;
  handleEditExpense: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  isLoading,
  filteredExpenses,
  categories,
  subcategories,
  selectedCategories,
  selectedSubcategory,
  handleAddExpense,
  handleEditExpense
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Recent Expenses
          {selectedCategories.length === 1 && ` - ${categories.find(c => c.id === selectedCategories[0])?.name}`}
          {selectedCategories.length > 1 && ` - Multiple Categories (${selectedCategories.length})`}
          {selectedSubcategory && ` - ${subcategories.find(s => s.id === selectedSubcategory)?.name}`}
        </h2>
        
        <button 
          onClick={handleAddExpense}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle size={20} />
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse w-full space-y-4">
            <div className="h-16 bg-muted rounded-xl"></div>
            <div className="h-16 bg-muted rounded-xl"></div>
            <div className="h-16 bg-muted rounded-xl"></div>
          </div>
        </div>
      ) : filteredExpenses.length > 0 ? (
        <AnimatePresence>
          {filteredExpenses
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(expense => {
              const category = categories.find(c => c.id === expense.categoryId)!;
              const subcategory = subcategories.find(s => s.id === expense.subcategoryId)!;
              
              return (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  category={category}
                  subcategory={subcategory}
                  onEdit={handleEditExpense}
                />
              );
            })
          }
        </AnimatePresence>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="rounded-full bg-secondary p-4 mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No expenses yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Start tracking your expenses by adding your first one
          </p>
          <button 
            onClick={handleAddExpense}
            className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Add Expense
          </button>
        </motion.div>
      )}
    </>
  );
};

export default ExpenseList;
