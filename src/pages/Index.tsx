import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ExpenseList from '@/components/ExpenseList';
import MonthSummary from '@/components/MonthSummary';
import FilterSection from '@/components/FilterSection';
import { Input } from '@/components/ui/input';
import { Search, CheckSquare } from 'lucide-react';
import { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  
  const { 
    expenses, 
    categories, 
    subcategories, 
    getMonthlyExpenses,
    getMonthlyStatistics,
  } = useExpenseStore();
  
  const monthlyExpenses = getMonthlyExpenses(selectedMonth);
  const { totalAmount, categoryBreakdown } = getMonthlyStatistics(selectedMonth);
  
  // Filter expenses
  const filteredExpenses = monthlyExpenses.filter(expense => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(expense.categoryId)) {
      return false;
    }
    if (selectedSubcategory && expense.subcategoryId !== selectedSubcategory) {
      return false;
    }
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const category = categories.find(c => c.id === expense.categoryId);
      const subcategory = subcategories.find(s => s.id === expense.subcategoryId);
      
      return (
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.amount.toString().includes(searchLower) ||
        category?.name.toLowerCase().includes(searchLower) ||
        subcategory?.name.toLowerCase().includes(searchLower) ||
        formatCurrency(expense.amount).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Calculate selected category-subcategory total
  const selectedCategorySubcategoryTotal = filteredExpenses.reduce(
    (total, expense) => total + expense.amount, 
    0
  );
  
  // Calculate total for selected expenses
  const selectedExpensesTotal = isSelectionMode && selectedExpenses.length > 0
    ? filteredExpenses
        .filter(expense => selectedExpenses.includes(expense.id))
        .reduce((total, expense) => total + expense.amount, 0)
    : 0;
    
  // Calculate category breakdown for selected expenses
  const selectedExpensesCategoryBreakdown = isSelectionMode && selectedExpenses.length > 0
    ? Object.entries(
        filteredExpenses
          .filter(expense => selectedExpenses.includes(expense.id))
          .reduce((breakdown, expense) => {
            const categoryId = expense.categoryId;
            if (!breakdown[categoryId]) {
              breakdown[categoryId] = 0;
            }
            breakdown[categoryId] += expense.amount;
            return breakdown;
          }, {} as Record<string, number>)
      ).map(([id, total]) => {
        const category = categories.find(c => c.id === id);
        return {
          id,
          total,
          color: category.type === 'food' ? 'green-500' : 
               category.type === 'home' ? 'blue-500' : 
               category.type === 'car' ? 'red-500' : 
               category.type === 'groceries' ? 'yellow-500' : 'purple-500'
        };
      })
    : [];

  // Get available subcategories for the selected categories
  const availableSubcategories = selectedCategories.length > 0
    ? subcategories.filter(sub => selectedCategories.includes(sub.categoryId))
    : [];
  
  // Get names for selected categories and subcategory
  const selectedCategoryName = selectedCategories.length === 1
    ? categories.find(c => c.id === selectedCategories[0])?.name
    : selectedCategories.length > 1 ? `Multiple Categories (${selectedCategories.length})` : null;
  
  const selectedSubcategoryName = selectedSubcategory 
    ? subcategories.find(s => s.id === selectedSubcategory)?.name 
    : null;
  
  useEffect(() => {
    // Reset selected subcategory when categories change
    setSelectedSubcategory(null);
    
    // Simulate loading for smoother animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedCategories, selectedMonth]);
  
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prevCategories => {
      if (prevCategories.includes(categoryId)) {
        // Remove the category if it's already selected
        return prevCategories.filter(id => id !== categoryId);
      } else {
        // Add the category if it's not already selected
        return [...prevCategories, categoryId];
      }
    });
    setIsSubcategoriesOpen(true);
  };

  const handleSubcategoryFilter = (subcategoryId: string) => {
    setSelectedSubcategory(prevId => prevId === subcategoryId ? null : subcategoryId);
  };
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategory(null);
    setIsSubcategoriesOpen(false);
    setSearchQuery('');
  };
  
  const handleAddExpense = () => {
    navigate('/add');
  };
  
  const handleEditExpense = (expense: Expense) => {
    // Navigate to edit form with expense data
    navigate('/add', { state: { expense } });
  };
  
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedExpenses([]);
  };
  
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };
  
  const selectAllExpenses = () => {
    const allExpenseIds = filteredExpenses.map(expense => expense.id);
    setSelectedExpenses(allExpenseIds);
  };
  
  const clearSelection = () => {
    setSelectedExpenses([]);
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-1">Track and manage your spending</p>
      </div>
      
      <MonthSummary 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        totalAmount={isSelectionMode && selectedExpenses.length > 0 ? selectedExpensesTotal : totalAmount}
        categoryBreakdown={isSelectionMode && selectedExpenses.length > 0 ? selectedExpensesCategoryBreakdown : categoryBreakdown}
        selectedCategorySubcategoryTotal={
          isSelectionMode && selectedExpenses.length > 0 
            ? selectedExpensesTotal 
            : selectedCategories.length > 0 
              ? selectedCategorySubcategoryTotal 
              : undefined
        }
        selectedCategoryName={
          isSelectionMode && selectedExpenses.length > 0 
            ? `Selected (${selectedExpenses.length})` 
            : selectedCategoryName || undefined
        }
        selectedSubcategoryName={
          !isSelectionMode ? selectedSubcategoryName || undefined : undefined
        }
      />
      
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={isSelectionMode ? "default" : "outline"} 
            size="sm"
            onClick={toggleSelectionMode}
            className="flex items-center gap-1"
          >
            <CheckSquare className="h-4 w-4" />
            {isSelectionMode ? "Exit Selection" : "Select"}
          </Button>
          
          {isSelectionMode && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={selectAllExpenses}
                disabled={filteredExpenses.length === 0}
              >
                Select All
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSelection}
                disabled={selectedExpenses.length === 0}
              >
                Clear
              </Button>
              
              <div className="ml-auto text-sm text-muted-foreground">
                {selectedExpenses.length} of {filteredExpenses.length} selected
              </div>
            </>
          )}
        </div>
      </div>
      
      <FilterSection 
        categories={categories}
        categoryBreakdown={categoryBreakdown}
        selectedCategories={selectedCategories}
        handleCategoryFilter={handleCategoryFilter}
        selectedSubcategory={selectedSubcategory}
        handleSubcategoryFilter={handleSubcategoryFilter}
        availableSubcategories={availableSubcategories}
        isSubcategoriesOpen={isSubcategoriesOpen}
        setIsSubcategoriesOpen={setIsSubcategoriesOpen}
        clearFilters={clearFilters}
      />
      
      <ExpenseList 
        isLoading={isLoading}
        filteredExpenses={filteredExpenses}
        categories={categories}
        subcategories={subcategories}
        selectedCategories={selectedCategories}
        selectedSubcategory={selectedSubcategory}
        handleAddExpense={handleAddExpense}
        handleEditExpense={handleEditExpense}
        isSelectionMode={isSelectionMode}
        selectedExpenses={selectedExpenses}
        toggleExpenseSelection={toggleExpenseSelection}
      />
    </Layout>
  );
};

export default Index;
