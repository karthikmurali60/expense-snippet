
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

// Import refactored components
import AmountInput from '@/components/expense/AmountInput';
import DescriptionInput from '@/components/expense/DescriptionInput';
import DateSelector from '@/components/expense/DateSelector';
import RecurringExpenseOption from '@/components/expense/RecurringExpenseOption';
import CategorySelector from '@/components/expense/CategorySelector';
import SubcategorySelector from '@/components/expense/SubcategorySelector';
import SubmitButton from '@/components/expense/SubmitButton';
import SplitwiseIntegration from '@/components/expense/SplitwiseIntegration';
import { createSplitwiseExpense, getCurrentSplitwiseUser } from '@/integrations/splitwise/client';

const AddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingExpense = location.state?.expense as Expense | undefined;
  const isMobile = useMobile();
  
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
  const [isIndefinite, setIsIndefinite] = useState(false);
  
  // Splitwise integration state
  const [isSplitwiseEnabled, setIsSplitwiseEnabled] = useState(false);
  const [selectedSplitwiseGroupId, setSelectedSplitwiseGroupId] = useState<number | null>(null);
  const [selectedSplitwiseMemberIds, setSelectedSplitwiseMemberIds] = useState<number[]>([]);
  
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
    if (!isNaN(parsedValue) && (parsedValue > 0 || isIndefinite)) {
      setRecurringMonths(parsedValue);
    }
  }, [recurringMonthsInput, isIndefinite]);
  
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
    
    if (isRecurring && !isIndefinite) {
      const parsedMonths = parseInt(recurringMonthsInput);
      if (isNaN(parsedMonths) || parsedMonths <= 0 || parsedMonths > 60) {
        toast.error('Please enter a valid number of months (1-60)');
        return false;
      }
    }
    
    if (isSplitwiseEnabled) {
      if (!selectedSplitwiseGroupId) {
        toast.error('Please select a Splitwise group');
        return false;
      }
      if (selectedSplitwiseMemberIds.length === 0) {
        toast.error('Please select at least one member to split the expense with');
        return false;
      }
    }
    
    return true;
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring click");
      return;
    }
    
    console.log("Form submit triggered, validating...");
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    console.log("Setting isSubmitting to true");
    setIsSubmitting(true);
    
    try {
      console.log("Creating expense data object");
      const expenseData = {
        amount,
        description,
        date,
        categoryId,
        subcategoryId,
        ...(isRecurring && {
          recurring: {
            isRecurring,
            months: isIndefinite ? 0 : recurringMonths,
            startMonth: format(date, 'yyyy-MM')
          }
        })
      };
      
      let savedExpense;
      
      if (editingExpense) {
        console.log("Updating existing expense");
        savedExpense = await updateExpense(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
      } else {
        if (isSplitwiseEnabled && selectedSplitwiseGroupId && selectedSplitwiseMemberIds.length > 0) {
          console.log("Creating Splitwise expense");
          // Format date as YYYY-MM-DD
          const formattedDate = format(date, 'yyyy-MM-dd');
          
          // Calculate share per member
          const sharePerMember = amount / selectedSplitwiseMemberIds.length;
          
          // Get current user's Splitwise ID
          const currentUserId = await getCurrentSplitwiseUser();
          if (!currentUserId) {
            throw new Error('Splitwise user ID not found');
          }
          
          // Get all members from the selected group
          const response = await fetch(
            `${import.meta.env.VITE_SPLITWISE_WRAPPER_URL}/get_group_info?group_id=${selectedSplitwiseGroupId}`,
            {
              headers: {
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch group members');
          }
          
          const { users: allGroupMembers } = await response.json();
          
          // Reorder members to put current user first
          const reorderedMembers = [
            allGroupMembers.find(member => member.id === currentUserId),
            ...allGroupMembers.filter(member => member.id !== currentUserId)
          ].filter(Boolean); // Remove any undefined values
          
          // Create Splitwise expense with all members
          const splitwiseResponse = await createSplitwiseExpense({
            cost: amount.toString(),
            description: description,
            date: formattedDate,
            group_id: selectedSplitwiseGroupId,
            ...reorderedMembers.reduce((acc, member, index) => ({
              ...acc,
              [`users__${index}__user_id`]: member.id,
              [`users__${index}__paid_share`]: selectedSplitwiseMemberIds.includes(member.id) && index === 0 ? amount.toString() : "0",
              [`users__${index}__owed_share`]: selectedSplitwiseMemberIds.includes(member.id) ? sharePerMember.toString() : "0",
            }), {})
          });
          
          console.log("Splitwise expense created successfully:", splitwiseResponse);
          toast.success('Expense added to Splitwise');
        } else {
          console.log("Adding expense to local store");
          if (isRecurring) {
            console.log("Adding recurring expense");
            const expenses = await addRecurringExpense(expenseData);
            savedExpense = expenses[0];
            if (isIndefinite) {
              toast.success('Indefinite recurring expense added. Future months will be auto-generated.');
            } else {
              toast.success(`${expenses.length} recurring expenses added successfully`);
            }
          } else {
            console.log("Adding single expense");
            savedExpense = await addExpense(expenseData);
            toast.success('Expense added successfully');
          }
        }
      }
      
      console.log("Expense saved successfully, navigating back");
      navigate('/');
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to submit expense: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      console.log("Setting isSubmitting back to false");
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
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
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
          isIndefinite={isIndefinite}
          setIsIndefinite={setIsIndefinite}
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
        
        {!editingExpense && (
          <SplitwiseIntegration
            isEnabled={isSplitwiseEnabled}
            setIsEnabled={setIsSplitwiseEnabled}
            selectedGroupId={selectedSplitwiseGroupId}
            setSelectedGroupId={setSelectedSplitwiseGroupId}
            selectedMemberIds={selectedSplitwiseMemberIds}
            setSelectedMemberIds={setSelectedSplitwiseMemberIds}
            amount={amount}
          />
        )}
        
        <SubmitButton
          isSubmitting={isSubmitting}
          isEditing={!!editingExpense}
          isRecurring={isRecurring}
          recurringMonths={recurringMonths}
          initialized={initialized}
          isIndefinite={isIndefinite}
        />
      </form>
    </Layout>
  );
};

export default AddExpense;
