import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Check, Repeat } from 'lucide-react';
import { PopoverTrigger, Popover, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
    updateExpense 
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
  const [recurringOpen, setRecurringOpen] = useState(false);
  
  const filteredSubcategories = subcategories.filter(
    subcat => subcat.categoryId === categoryId
  );
  
  useEffect(() => {
    if (categoryId && filteredSubcategories.length > 0 && !subcategoryId) {
      setSubcategoryId(filteredSubcategories[0].id);
    }
  }, [categoryId, filteredSubcategories, subcategoryId]);
  
  const validateForm = () => {
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
    
    if (isRecurring && (recurringMonths <= 0 || recurringMonths > 60)) {
      toast.error('Please enter a valid number of months (1-60)');
      return false;
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
      
      console.log('Submitting expense...', {
        ...expenseData,
        isEditing: !!editingExpense
      });
      
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
        <div className="glass rounded-xl p-5">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount === 0 ? '' : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              className="w-full rounded-lg border border-input bg-background px-8 py-2 text-right text-xl font-semibold"
              autoFocus={!isMobile}
            />
          </div>
        </div>
        
        <div className="glass rounded-xl p-5">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
            className="w-full rounded-lg border border-input bg-background px-3 py-2"
          />
        </div>
        
        <div className="glass rounded-xl p-5">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Date
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {!editingExpense && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="recurring-switch" className="text-sm font-medium text-foreground">
                Recurring Expense
              </Label>
              <Switch 
                id="recurring-switch" 
                checked={isRecurring} 
                onCheckedChange={setIsRecurring}
              />
            </div>
            
            {isRecurring && (
              <div className="mt-4">
                <Label htmlFor="recurring-months" className="text-sm text-muted-foreground">
                  Repeat for
                </Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="recurring-months"
                    type="number"
                    min="1"
                    max="60"
                    value={recurringMonths}
                    onChange={(e) => setRecurringMonths(parseInt(e.target.value) || 3)}
                    className="w-20 mr-2"
                  />
                  <span className="text-sm text-muted-foreground">months</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This will create {recurringMonths} expenses, one for each month starting from the selected date.
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="glass rounded-xl p-5">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => {
              const IconComponent = (Icons as Record<string, any>)[category.icon] || Icons.Circle;
              
              return (
                <motion.button
                  key={category.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setCategoryId(category.id);
                    setSubcategoryId('');
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left",
                    categoryId === category.id
                      ? `bg-expense-${category.type} text-white border-transparent`
                      : "bg-background border-border"
                  )}
                >
                  <div className={cn(
                    "rounded-full p-1",
                    categoryId === category.id 
                      ? "bg-white/20" 
                      : `bg-expense-${category.type} text-white`
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
                  {categoryId === category.id && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {categoryId && filteredSubcategories.length > 0 && (
          <div className="glass rounded-xl p-5">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Subcategory
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredSubcategories.map(subcategory => (
                <motion.button
                  key={subcategory.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSubcategoryId(subcategory.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    subcategoryId === subcategory.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {subcategory.name}
                  {subcategoryId === subcategory.id && (
                    <Check className="inline-block h-3.5 w-3.5 ml-1.5" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? 'Saving...' 
            : editingExpense 
              ? 'Update Expense' 
              : isRecurring
                ? `Add Recurring Expense (${recurringMonths} months)`
                : 'Add Expense'
          }
        </Button>
      </form>
    </Layout>
  );
};

export default AddExpense;
