import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ExpenseList from '@/components/ExpenseList';
import MonthSummary from '@/components/MonthSummary';
import FilterSection from '@/components/FilterSection';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Expense } from '@/lib/types';

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-1">Track and manage your spending</p>
      </div>
      
      <MonthSummary 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        totalAmount={totalAmount}
        categoryBreakdown={categoryBreakdown}
        selectedCategorySubcategoryTotal={selectedCategories.length > 0 ? selectedCategorySubcategoryTotal : undefined}
        selectedCategoryName={selectedCategoryName || undefined}
        selectedSubcategoryName={selectedSubcategoryName || undefined}
      />
      
      <div className="mb-4">
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
      </div>
      
      <FilterSection 
        categories={categories}
        categoryBreakdown={categoryBreakdown}
        selectedCategories={selectedCategories}cl
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
      />
    </Layout>
  );
};

export default Index;
