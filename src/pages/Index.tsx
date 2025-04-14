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

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  
  // Filter expenses based on selected category, subcategory, and search query
  const filteredExpenses = monthlyExpenses.filter(expense => {
    if (selectedCategory && expense.categoryId !== selectedCategory) {
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
        subcategory?.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Calculate selected category-subcategory total
  const selectedCategorySubcategoryTotal = filteredExpenses.reduce(
    (total, expense) => total + expense.amount, 
    0
  );

  // Get available subcategories for the selected category
  const availableSubcategories = selectedCategory 
    ? subcategories.filter(sub => sub.categoryId === selectedCategory)
    : [];
  
  // Get names for selected category and subcategory
  const selectedCategoryName = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)?.name 
    : null;
  
  const selectedSubcategoryName = selectedSubcategory 
    ? subcategories.find(s => s.id === selectedSubcategory)?.name 
    : null;
  
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
    setIsSubcategoriesOpen(selectedCategory !== categoryId);
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
      
      <MonthSummary 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        totalAmount={totalAmount}
        categoryBreakdown={categoryBreakdown}
        selectedCategorySubcategoryTotal={selectedCategory ? selectedCategorySubcategoryTotal : undefined}
        selectedCategoryName={selectedCategoryName || undefined}
        selectedSubcategoryName={selectedSubcategoryName || undefined}
      />
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <FilterSection 
        categories={categories}
        categoryBreakdown={categoryBreakdown}
        selectedCategory={selectedCategory}
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
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        handleAddExpense={handleAddExpense}
        handleEditExpense={handleEditExpense}
      />
    </Layout>
  );
};

export default Index;
