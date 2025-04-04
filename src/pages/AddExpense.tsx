
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Import refactored components
import AmountInput from '@/components/expense/AmountInput';
import DescriptionInput from '@/components/expense/DescriptionInput';
import DateSelector from '@/components/expense/DateSelector';
import RecurringExpenseOption from '@/components/expense/RecurringExpenseOption';
import CategorySelector from '@/components/expense/CategorySelector';
import SubcategorySelector from '@/components/expense/SubcategorySelector';
import SubmitButton from '@/components/expense/SubmitButton';

const AddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingExpense = location.state?.expense as Expense | undefined;
  
  const { 
    categories, 
    subcategories, 
    addExpense,
    addRecurringExpense,
    updateExpense,
    initialized
  } = useExpenseStore();
  
  const [amount, setAmount] = useState(editingExpense?.amount || 0);
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [date, setDate] = useState<Date>(editingExpense?.date || new Date());
  const [categoryId, setCategoryId] = useState(editingExpense?.categoryId || categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState(editingExpense?.subcategoryId || '');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isRecurring, setIsRecurring] = useState(editingExpense?.recurring?.isRecurring || false);
  const [recurringMonths, setRecurringMonths] = useState(editingExpense?.recurring?.months || 3);
  const [recurringMonthsInput, setRecurringMonthsInput] = useState(
    (editingExpense?.recurring?.months || 3).toString()
  );
  
  // Update category selection once store is initialized and categories are loaded
  useEffect(() => {
    if (initialized && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]?.id || '');
    }
  }, [initialized, categories, categoryId]);
  
  useEffect(() => {
    if (categoryId && subcategories.filter(s => s.categoryId === categoryId).length > 0 && !subcategoryId) {
      setSubcategoryId(subcategories.filter(s => s.categoryId === categoryId)[0].id);
    }
  }, [categoryId, subcategories, subcategoryId]);

  // Update recurringMonths whenever the text input changes
  useEffect(() => {
    const parsedValue = parseInt(recurringMonthsInput);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      setRecurringMonths(parsedValue);
    }
  }, [recurringMonthsInput]);
  
  const validateForm = () => {
    if (!initialized) {
      toast.error('App is still initializing. Please try again in a moment.');
      return false;
    }
    
    if (!categoryId || !subcategoryId) {
      toast.error('Please select a category and subcategory');
      return false;
    }
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    
    if (isRecurring) {
      const parsedMonths = parseInt(recurringMonthsInput);
      if (isNaN(parsedMonths) || parsedMonths <= 0 || parsedMonths > 60) {
        toast.error('Please enter a valid number of months (1-60)');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        amount,
        description,
        date,
        categoryId,
        subcategoryId,
        ...(isRecurring && {
          recurring: {
            isRecurring,
            months: recurringMonths,
            startMonth: format(date, 'yyyy-MM')
          }
        })
      };
      
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
      } else {
        if (isRecurring) {
          const expenses = await addRecurringExpense(expenseData);
          toast.success(`${expenses.length} recurring expenses added successfully`);
        } else {
          await addExpense(expenseData);
          toast.success('Expense added successfully');
        }
      }
      navigate('/');
    } catch (error: any) {
      console.error('Failed to save expense:', error);
      toast.error('Failed to save expense: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  if (!initialized) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted-foreground">Loading expense data...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Button 
          onClick={goBack}
          variant="ghost" 
          size="icon"
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {editingExpense ? 'Edit Expense' : 'Add Expense'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <AmountInput amount={amount} setAmount={setAmount} />
        <DescriptionInput description={description} setDescription={setDescription} />
        <DateSelector 
          date={date} 
          setDate={setDate} 
          calendarOpen={calendarOpen} 
          setCalendarOpen={setCalendarOpen} 
        />
        
        <RecurringExpenseOption 
          isRecurring={isRecurring} 
          setIsRecurring={setIsRecurring}
          recurringMonthsInput={recurringMonthsInput}
          setRecurringMonthsInput={setRecurringMonthsInput}
          isEditing={!!editingExpense}
        />
        
        <CategorySelector 
          categories={categories} 
          categoryId={categoryId} 
          setCategoryId={setCategoryId}
          setSubcategoryId={setSubcategoryId}
        />
        
        <SubcategorySelector 
          subcategories={subcategories}
          subcategoryId={subcategoryId}
          setSubcategoryId={setSubcategoryId}
          categoryId={categoryId}
        />
        
        <SubmitButton 
          isSubmitting={isSubmitting}
          isEditing={!!editingExpense}
          isRecurring={isRecurring}
          recurringMonths={recurringMonths}
          initialized={initialized}
        />
      </form>
    </Layout>
  );
};

export default AddExpense;
