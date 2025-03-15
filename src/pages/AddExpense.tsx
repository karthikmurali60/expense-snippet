
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingExpense = location.state?.expense;
  
  const { categories, subcategories, addExpense, updateExpense } = useExpenseStore();
  
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [date, setDate] = useState<Date>(editingExpense?.date ? new Date(editingExpense.date) : new Date());
  const [categoryId, setCategoryId] = useState(editingExpense?.categoryId || (categories[0]?.id || ''));
  const [subcategoryId, setSubcategoryId] = useState(editingExpense?.subcategoryId || '');
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  
  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(
    subcat => subcat.categoryId === categoryId
  );
  
  // Auto-select first subcategory when category changes
  useEffect(() => {
    if (filteredSubcategories.length > 0 && !filteredSubcategories.find(s => s.id === subcategoryId)) {
      setSubcategoryId(filteredSubcategories[0].id);
    }
  }, [categoryId, filteredSubcategories, subcategoryId]);
  
  const handleAmountChange = (value: string) => {
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
    }
  };
  
  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    
    if (!subcategoryId) {
      toast.error('Please select a subcategory');
      return;
    }
    
    if (editingExpense) {
      updateExpense(
        editingExpense.id,
        parseFloat(amount),
        description,
        date,
        categoryId,
        subcategoryId
      );
      toast.success('Expense updated successfully');
    } else {
      addExpense(
        parseFloat(amount),
        description,
        date,
        categoryId,
        subcategoryId
      );
      toast.success('Expense added successfully');
      
      // If quick add is enabled, only reset amount and description
      if (isQuickAdd) {
        setAmount('');
        setDescription('');
      } else {
        // Navigate back to dashboard
        navigate('/');
        return;
      }
    }
    
    if (!isQuickAdd) {
      navigate('/');
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  // Determine the selected category to display its type
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {editingExpense ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {editingExpense ? 'Update your expense details' : 'Enter the details of your expense'}
        </p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Amount Input */}
        <div className="glass rounded-xl p-5">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground">$</span>
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full pl-8 pr-3 py-3 text-2xl font-bold bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
              inputMode="decimal"
              autoFocus
            />
          </div>
        </div>
        
        {/* Description Input */}
        <div className="glass rounded-xl p-5">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter description"
          />
        </div>
        
        {/* Date Picker */}
        <div className="glass rounded-xl p-5">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Select a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Category and Subcategory Selector */}
        <div className="glass rounded-xl p-5">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Category
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {categories.map((category) => {
              const IconComponent = (Icons as Record<string, any>)[category.icon] || Icons.Circle;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300",
                    categoryId === category.id
                      ? `bg-expense-${category.type} text-white shadow-lg`
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  )}
                >
                  <IconComponent className="h-6 w-6 mb-1" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
          
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Subcategory
          </label>
          
          <div className="flex flex-wrap gap-2">
            {filteredSubcategories.map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => setSubcategoryId(subcat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  subcategoryId === subcat.id
                    ? selectedCategory 
                      ? `bg-expense-${selectedCategory.type} text-white` 
                      : "bg-primary text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Add Toggle */}
        {!editingExpense && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Quick add mode</label>
            <button
              onClick={() => setIsQuickAdd(!isQuickAdd)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isQuickAdd ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                  isQuickAdd ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-input bg-background hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {editingExpense ? 'Update' : 'Save'}
          </button>
        </div>
      </motion.div>
    </Layout>
  );
};

export default AddExpense;
