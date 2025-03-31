
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryPill from '@/components/CategoryPill';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    expenses, 
    categories, 
    subcategories, 
    getMonthlyExpenses,
    getMonthlyStatistics,
  } = useExpenseStore();
  
  const monthlyExpenses = getMonthlyExpenses(selectedMonth);
  const { totalAmount, categoryBreakdown } = getMonthlyStatistics(selectedMonth);
  
  // Filter expenses based on selected category and subcategory
  const filteredExpenses = monthlyExpenses.filter(expense => {
    if (selectedCategory && expense.categoryId !== selectedCategory) {
      return false;
    }
    if (selectedSubcategory && expense.subcategoryId !== selectedSubcategory) {
      return false;
    }
    return true;
  });

  // Get available subcategories for the selected category
  const availableSubcategories = selectedCategory 
    ? subcategories.filter(sub => sub.categoryId === selectedCategory)
    : [];
  
  useEffect(() => {
    // Reset selected subcategory when category changes
    setSelectedSubcategory(null);
    
    // Simulate loading for smoother animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedMonth]);
  
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(prevId => prevId === categoryId ? null : categoryId);
    // Fixed: Compare categoryId (string) with prevId (string)
    setIsSubcategoriesOpen(prevId => categoryId !== prevId);
  };

  const handleSubcategoryFilter = (subcategoryId: string) => {
    setSelectedSubcategory(prevId => prevId === subcategoryId ? null : subcategoryId);
  };
  
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setIsSubcategoriesOpen(false);
  };
  
  const handleAddExpense = () => {
    navigate('/add');
  };
  
  const handleEditExpense = (expense: any) => {
    // Navigate to edit form with expense data
    navigate('/add', { state: { expense } });
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-1">Track and manage your spending</p>
      </div>
      
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
        
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => {
            const amount = categoryBreakdown.find(c => c.id === category.id)?.total || 0;
            if (amount === 0) return null;
            
            return (
              <CategoryPill 
                key={category.id}
                type={category.type}
                name={category.name}
                icon={category.icon}
                onClick={() => handleCategoryFilter(category.id)}
                selected={selectedCategory === category.id}
              />
            );
          })}
        </div>
        
        {selectedCategory && availableSubcategories.length > 0 && (
          <Collapsible 
            open={isSubcategoriesOpen} 
            onOpenChange={setIsSubcategoriesOpen}
            className="mt-4"
          >
            <CollapsibleTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Subcategories
              {isSubcategoriesOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-2 mt-2">
                {availableSubcategories.map(subcategory => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryFilter(subcategory.id)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedSubcategory === subcategory.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {(selectedCategory || selectedSubcategory) && (
          <button 
            onClick={clearFilters}
            className="flex items-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </button>
        )}
      </motion.div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Recent Expenses
          {selectedCategory && ` - ${categories.find(c => c.id === selectedCategory)?.name}`}
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
    </Layout>
  );
};

export default Index;
