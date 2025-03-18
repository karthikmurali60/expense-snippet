
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Pencil, Trash2, Target, Calendar, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PopoverTrigger, Popover, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

const GoalColors = ['blue-500', 'green-500', 'red-500', 'yellow-500', 'purple-500', 'pink-500'];
const IconOptions = ['Target', 'Home', 'Car', 'Plane', 'Briefcase', 'GraduationCap', 'Heart', 'Gift'];

const Goals = () => {
  const navigate = useNavigate();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useExpenseStore();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedIcon, setSelectedIcon] = useState('Target');
  const [selectedColor, setSelectedColor] = useState('blue-500');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [contributionDialog, setContributionDialog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  const goBack = () => {
    navigate(-1);
  };
  
  const handleAddGoal = () => {
    setGoalName('');
    setTargetAmount(0);
    setCurrentAmount(0);
    setDueDate(undefined);
    setSelectedIcon('Target');
    setSelectedColor('blue-500');
    setEditingGoal(null);
    setDialogOpen(true);
  };
  
  const handleEditGoal = (goal: any) => {
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setDueDate(goal.dueDate);
    setSelectedIcon(goal.icon);
    setSelectedColor(goal.color);
    setEditingGoal(goal.id);
    setDialogOpen(true);
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteSavingsGoal(goalId);
    } catch (error) {
      // Error is already handled in the store
    }
  };
  
  const handleSubmitGoal = async () => {
    if (!goalName.trim()) {
      toast.error('Please enter a goal name');
      return;
    }
    
    if (targetAmount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }
    
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal, {
          name: goalName,
          targetAmount,
          currentAmount,
          dueDate,
          icon: selectedIcon,
          color: selectedColor
        });
        toast.success('Goal updated successfully');
      } else {
        await addSavingsGoal({
          name: goalName,
          targetAmount,
          currentAmount,
          dueDate,
          icon: selectedIcon,
          color: selectedColor
        });
        toast.success('Goal added successfully');
      }
      
      setDialogOpen(false);
    } catch (error) {
      // Error is already handled in the store
    }
  };
  
  const handleOpenContribution = (goalId: string) => {
    setSelectedGoalId(goalId);
    setContributionAmount(0);
    setContributionDialog(true);
  };
  
  const handleContribute = async () => {
    if (!selectedGoalId) return;
    
    if (contributionAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (!goal) return;
    
    const newAmount = goal.currentAmount + contributionAmount;
    const isCompleted = newAmount >= goal.targetAmount;
    
    try {
      await updateSavingsGoal(selectedGoalId, {
        currentAmount: newAmount
      });
      
      if (isCompleted) {
        toast.success('🎉 Congratulations! Goal reached!');
      } else {
        toast.success('Contribution added successfully');
      }
      
      setContributionDialog(false);
    } catch (error) {
      // Error is already handled in the store
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-medium">Your Goals</h2>
        <Button onClick={handleAddGoal} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>
      
      {savingsGoals.length > 0 ? (
        <div className="space-y-4">
          {savingsGoals.map((goal) => {
            const IconComponent = (Icons as Record<string, any>)[goal.icon] || Icons.Target;
            const percentage = goal.targetAmount > 0 
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isCompleted = percentage >= 100;
            
            return (
              <motion.div 
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-xl p-4 border-l-4 border-${goal.color}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 bg-${goal.color} text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{goal.name}</span>
                    {isCompleted && (
                      <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Completed!
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenContribution(goal.id)}
                      disabled={isCompleted}
                    >
                      Add Funds
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                  </span>
                  {goal.dueDate && (
                    <span className="text-muted-foreground ml-4 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(goal.dueDate, 'PP')}
                    </span>
                  )}
                </div>
                
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isCompleted ? 'bg-green-200' : `bg-${goal.color}/20`}`}
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className={isCompleted ? 'text-green-600 font-medium' : ''}>
                    {Math.round(percentage)}% complete
                  </span>
                  {!isCompleted && (
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating a goal to save for
          </p>
          <Button onClick={handleAddGoal}>
            <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
          </Button>
        </div>
      )}
      
      {/* Add/Edit Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Goal Name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., New Car, Vacation, Emergency Fund"
                className="w-full rounded-lg border border-input bg-background px-3 py-2"
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={targetAmount === 0 ? '' : targetAmount}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-input bg-background px-8 py-2"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Current Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={currentAmount === 0 ? '' : currentAmount}
                  onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-input bg-background px-8 py-2"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Date (Optional)
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="grid grid-cols-4 gap-2">
                {IconOptions.map((icon) => {
                  const IconComponent = (Icons as Record<string, any>)[icon];
                  return (
                    <Button
                      key={icon}
                      type="button"
                      variant="outline"
                      className={cn(
                        "flex items-center justify-center p-2 h-12",
                        selectedIcon === icon && "border-2 border-primary"
                      )}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      <IconComponent className="h-6 w-6" />
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2">
                {GoalColors.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline"
                    className={cn(
                      `h-8 w-8 rounded-full p-0 bg-${color}`,
                      selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </Button>
                ))}
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
            <Button onClick={handleSubmitGoal}>
              {editingGoal ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Contribution Dialog */}
      <Dialog open={contributionDialog} onOpenChange={setContributionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Contribution Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={contributionAmount === 0 ? '' : contributionAmount}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border border-input bg-background px-8 py-2"
                  autoFocus
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContributionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleContribute}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Goals;
