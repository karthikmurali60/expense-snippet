import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit, Trash2, MoreHorizontal, CheckCircle } from 'lucide-react';
import { CategoryType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

// Available icons for categories
const availableIcons = [
  'Car', 'Home', 'ShoppingBag', 'Utensils', 'Gift', 
  'Briefcase', 'HeartPulse', 'Plane', 'Bus', 'Train', 
  'Smartphone', 'ShoppingCart', 'Coffee', 'Wine', 'DollarSign',
  'CreditCard', 'Wallet', 'Building', 'BaggageClaim', 'BookOpen'
];

const Categories = () => {
  const { 
    categories, 
    subcategories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
  } = useExpenseStore();
  
  const [activeTab, setActiveTab] = useState('categories');
  
  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<CategoryType>('misc');
  const [categoryIcon, setCategoryIcon] = useState('Gift');
  
  // Subcategory dialog state
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  
  // Open category dialog for adding
  const openAddCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType('misc');
    setCategoryIcon('Gift');
    setCategoryDialogOpen(true);
  };
  
  // Open category dialog for editing
  const openEditCategoryDialog = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryIcon(category.icon);
    setCategoryDialogOpen(true);
  };
  
  // Handle category save
  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryName,
        type: categoryType,
        icon: categoryIcon
      });
      toast.success('Category updated successfully');
    } else {
      createCategory({
        name: categoryName,
        type: categoryType,
        icon: categoryIcon
      });
      toast.success('Category added successfully');
    }
    
    setCategoryDialogOpen(false);
  };
  
  // Handle category delete
  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure? This will also delete all subcategories and expenses in this category.')) {
      deleteCategory(id);
      toast.success('Category deleted successfully');
    }
  };
  
  // Open subcategory dialog for adding
  const openAddSubcategoryDialog = (categoryId?: string) => {
    setEditingSubcategory(null);
    setSubcategoryName('');
    setParentCategoryId(categoryId || categories[0]?.id || '');
    setSubcategoryDialogOpen(true);
  };
  
  // Open subcategory dialog for editing
  const openEditSubcategoryDialog = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setSubcategoryName(subcategory.name);
    setParentCategoryId(subcategory.categoryId);
    setSubcategoryDialogOpen(true);
  };
  
  // Handle subcategory save
  const handleSaveSubcategory = () => {
    if (!subcategoryName.trim()) {
      toast.error('Please enter a subcategory name');
      return;
    }
    
    if (!parentCategoryId) {
      toast.error('Please select a parent category');
      return;
    }
    
    if (editingSubcategory) {
      updateSubCategory(editingSubcategory.id, {
        name: subcategoryName,
        categoryId: parentCategoryId
      });
      toast.success('Subcategory updated successfully');
    } else {
      createSubCategory({
        name: subcategoryName,
        categoryId: parentCategoryId
      });
      toast.success('Subcategory added successfully');
    }
    
    setSubcategoryDialogOpen(false);
  };
  
  // Handle subcategory delete
  const handleDeleteSubcategory = (id: string) => {
    if (confirm('Are you sure? This will also delete all expenses in this subcategory.')) {
      deleteSubCategory(id);
      toast.success('Subcategory deleted successfully');
    }
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage your expense categories</p>
      </div>
      
      <Tabs defaultValue="categories" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button 
              onClick={openAddCategoryDialog}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {categories.map(category => {
                const IconComponent = (Icons as Record<string, any>)[category.icon] || Icons.Circle;
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="glass rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-expense-${category.type} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {categories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No categories yet</p>
                <Button 
                  onClick={openAddCategoryDialog}
                  variant="outline"
                  className="mt-4"
                >
                  Add your first category
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="subcategories">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Subcategories</h2>
            <Button 
              onClick={() => openAddSubcategoryDialog()}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
          
          {categories.map(category => {
            const categorySubcategories = subcategories.filter(
              sub => sub.categoryId === category.id
            );
            
            if (categorySubcategories.length === 0) return null;
            
            return (
              <div key={category.id} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {category.name}
                  </h3>
                  <Button 
                    onClick={() => openAddSubcategoryDialog(category.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {categorySubcategories.map(subcategory => (
                      <motion.div
                        key={subcategory.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-secondary rounded-lg p-3 flex items-center justify-between"
                      >
                        <span>{subcategory.name}</span>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => openEditSubcategoryDialog(subcategory)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
          
          {subcategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subcategories yet</p>
              <Button 
                onClick={() => openAddSubcategoryDialog()}
                variant="outline"
                className="mt-4"
              >
                Add your first subcategory
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Category name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {(['car', 'groceries', 'home', 'food', 'misc'] as CategoryType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setCategoryType(type)}
                    className={`w-full aspect-square rounded-md ${
                      categoryType === type 
                        ? `bg-expense-${type} ring-2 ring-white/30 shadow` 
                        : `bg-expense-${type} opacity-70`
                    }`}
                    aria-label={`Select ${type} color`}
                  >
                    {categoryType === type && (
                      <CheckCircle className="h-5 w-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="grid grid-cols-5 gap-3 mt-1 max-h-40 overflow-y-auto p-1">
                {availableIcons.map(icon => {
                  const IconComponent = (Icons as Record<string, any>)[icon];
                  
                  return (
                    <button
                      key={icon}
                      onClick={() => setCategoryIcon(icon)}
                      className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                        categoryIcon === icon
                          ? `bg-expense-${categoryType} text-white shadow-sm`
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                      }`}
                      aria-label={`Select ${icon} icon`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
          </DialogTitle>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Subcategory name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Parent Category</label>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubcategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubcategory}>
              {editingSubcategory ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Categories;
