
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Budgets = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  
  const { 
    categories, 
    budgets,
    getBudgetByMonth,
    getBudgetProgress,
    addBudget,
    updateBudget,
    deleteBudget
  } = useExpenseStore();
  
  const monthlyBudgets = getBudgetByMonth(selectedMonth);
  const budgetProgress = getBudgetProgress(selectedMonth);
  
  const handleAddBudget = () => {
    if (categories.length === 0) {
      toast.error('Please add categories first');
      return;
    }
    setSelectedCategory(categories[0].id);
    setBudgetAmount(0);
    setEditingBudget(null);
    setDialogOpen(true);
  };
  
  const handleEditBudget = (categoryId: string) => {
    const budget = monthlyBudgets[categoryId];
    if (budget) {
      setSelectedCategory(categoryId);
      setBudgetAmount(budget.amount);
      setEditingBudget(budget.id);
      setDialogOpen(true);
    }
  };
  
  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
    } catch (error) {
      // Error is already handled in the store
    }
  };
  
  const handleSubmitBudget = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    
    if (budgetAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingBudget) {
        await updateBudget(editingBudget, { 
          amount: budgetAmount,
          categoryId: selectedCategory
        });
      } else {
        // Check if budget already exists for this category and month
        const existingBudget = Object.values(monthlyBudgets).find(
          b => b.categoryId === selectedCategory
        );
        
        if (existingBudget) {
          await updateBudget(existingBudget.id, { amount: budgetAmount });
        } else {
          await addBudget({
            amount: budgetAmount,
            month: selectedMonth,
            categoryId: selectedCategory
          });
        }
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error submitting budget:', error);
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
        <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
      </div>
      
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onChange={setSelectedMonth} 
      />
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-medium">
          Budgets for {getMonthName(selectedMonth)}
        </h2>
        <Button onClick={handleAddBudget} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Budget
        </Button>
      </div>
      
      {budgetProgress.length > 0 ? (
        <div className="space-y-4">
          {budgetProgress.map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return null;
            
            const percentage = budget.percentage;
            const isOverBudget = percentage >= 100;
            
            return (
              <motion.div 
                key={budget.categoryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {budget.budgetAmount > 0 && (
                      <span className="text-sm text-muted-foreground dark:text-foreground/70">
                        ({formatCurrency(budget.spentAmount)} of {formatCurrency(budget.budgetAmount)})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditBudget(budget.categoryId)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {budget.budgetAmount > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteBudget(monthlyBudgets[budget.categoryId].id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isOverBudget ? 'bg-destructive/20' : 'bg-secondary'}`}
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
                    {isOverBudget ? 'Over budget!' : `${Math.round(percentage)}% used`}
                  </span>
                  {budget.budgetAmount === 0 && (
                    <span className="text-muted-foreground dark:text-foreground/70">No budget set</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No budgets yet</h3>
          <p className="text-muted-foreground dark:text-foreground/70 mb-4">
            Start by setting a budget for a category
          </p>
          <Button onClick={handleAddBudget}>
            <Plus className="h-4 w-4 mr-2" /> Add Your First Budget
          </Button>
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Budget Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-foreground/70">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={budgetAmount === 0 ? '' : budgetAmount}
                  onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-input bg-background px-8 py-2 text-right text-foreground"
                  autoFocus
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBudget}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Saving...
                </>
              ) : (
                editingBudget ? 'Update' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Budgets;
