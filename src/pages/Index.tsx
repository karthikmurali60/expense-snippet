
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryPill from '@/components/CategoryPill';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    expenses, 
    categories, 
    subcategories, 
    getMonthlyExpenses,
    getMonthlyStatistics,
    deleteExpense
  } = useExpenseStore();
  
  const monthlyExpenses = getMonthlyExpenses(selectedMonth);
  const { totalAmount, categoryBreakdown } = getMonthlyStatistics(selectedMonth);
  
  const filteredExpenses = selectedCategory 
    ? monthlyExpenses.filter(exp => exp.categoryId === selectedCategory)
    : monthlyExpenses;
  
  useEffect(() => {
    // Simulate loading for smoother animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(prevId => prevId === categoryId ? null : categoryId);
  };
  
  const handleAddExpense = () => {
    navigate('/add');
  };
  
  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
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
      </motion.div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Recent Expenses
          {selectedCategory && ` - ${categories.find(c => c.id === selectedCategory)?.name}`}
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
                  onDelete={handleDeleteExpense}
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
