
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ExpenseList from '@/components/ExpenseList';
import MonthSummary from '@/components/MonthSummary';
import FilterSection from '@/components/FilterSection';

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
    // Fix: This line had a type comparison error
    setIsSubcategoriesOpen(selectedCategory === categoryId);
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
      />
      
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
