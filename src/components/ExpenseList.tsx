import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, CheckSquare, X, Trash2, Tag } from 'lucide-react';
import ExpenseCard from '@/components/ExpenseCard';
import { Category, Subcategory, Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  isLoading: boolean;
  filteredExpenses: Expense[];
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategories: string[];
  selectedSubcategory: string | null;
  handleAddExpense: () => void;
  handleEditExpense: (expense: Expense) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRecategorize: (ids: string[]) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  isLoading,
  filteredExpenses,
  categories,
  subcategories,
  selectedCategories,
  selectedSubcategory,
  handleAddExpense,
  handleEditExpense,
  onBulkDelete,
  onBulkRecategorize,
}) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  // Reset visible count when the list changes
  useEffect(() => {
    setVisibleCount(20);
  }, [filteredExpenses]);

  // Reset select mode when list changes (e.g. month switch)
  useEffect(() => {
    setIsSelectMode(false);
    setSelectedIds([]);
  }, [filteredExpenses]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredExpenses.map((e) => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    onBulkDelete(selectedIds);
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const handleBulkRecategorize = () => {
    if (selectedIds.length === 0) return;
    onBulkRecategorize(selectedIds);
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const visibleExpenses = sortedExpenses.slice(0, visibleCount);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Recent Expenses
          {selectedCategories.length === 1 && ` - ${categories.find(c => c.id === selectedCategories[0])?.name}`}
          {selectedCategories.length > 1 && ` - Multiple Categories (${selectedCategories.length})`}
          {selectedSubcategory && ` - ${subcategories.find(s => s.id === selectedSubcategory)?.name}`}
        </h2>

        <div className="flex items-center gap-2">
          {filteredExpenses.length > 0 && (
            <button
              onClick={() => {
                setIsSelectMode((v) => !v);
                setSelectedIds([]);
              }}
              className="text-sm px-3 py-1 rounded-full border border-border hover:bg-secondary transition-colors"
            >
              {isSelectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <button
            onClick={handleAddExpense}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {isSelectMode && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/50 flex-wrap">
          <span className="text-sm text-muted-foreground mr-1">
            {selectedIds.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-7 text-xs"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="h-7 text-xs"
          >
            Deselect All
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRecategorize}
            disabled={selectedIds.length === 0}
            className="h-7 text-xs gap-1"
          >
            <Tag className="h-3 w-3" />
            Re-categorize ({selectedIds.length})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className="h-7 text-xs gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete ({selectedIds.length})
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse w-full space-y-4">
            <div className="h-16 bg-muted rounded-xl"></div>
            <div className="h-16 bg-muted rounded-xl"></div>
            <div className="h-16 bg-muted rounded-xl"></div>
          </div>
        </div>
      ) : filteredExpenses.length > 0 ? (
        <>
          <AnimatePresence>
            {visibleExpenses.map(expense => {
              const category = categories.find(c => c.id === expense.categoryId)!;
              const subcategory = subcategories.find(s => s.id === expense.subcategoryId)!;

              return (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  category={category}
                  subcategory={subcategory}
                  onEdit={handleEditExpense}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.includes(expense.id)}
                  onToggleSelect={handleToggleSelect}
                />
              );
            })}
          </AnimatePresence>

          {filteredExpenses.length > visibleCount && (
            <div className="flex flex-col items-center gap-2 mt-4 pb-2">
              <p className="text-sm text-muted-foreground">
                Showing {visibleCount} of {filteredExpenses.length} expenses
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setVisibleCount((v) => v + 20)}
                  className="text-sm px-4 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Show more
                </button>
                <button
                  onClick={() => setVisibleCount(filteredExpenses.length)}
                  className="text-sm px-4 py-1.5 rounded-full border border-border hover:bg-secondary/50 transition-colors"
                >
                  Show all
                </button>
              </div>
            </div>
          )}
        </>
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
