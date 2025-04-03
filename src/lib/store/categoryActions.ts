
import { toast } from 'sonner';
import { CategoryActions, State, Store } from './types';
import { convertToCategory, convertToSubCategory, supabaseClient, handleError } from './utils';

export const categoryActions = (set: any, get: () => Store): CategoryActions => ({
  createCategory: async (category) => {
    try {
      const user = (await supabaseClient.auth.getUser()).data.user;
      if (!user) throw new Error('You must be logged in to create categories');

      const { data, error } = await supabaseClient
        .from('categories')
        .insert({
          name: category.name,
          type: category.type,
          icon: category.icon,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCategory = convertToCategory(data);
        set((state: State) => ({
          categories: [...state.categories, newCategory]
        }));
        return newCategory;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to create category');
    }
  },
  
  createSubCategory: async (subCategory) => {
    try {
      const user = (await supabaseClient.auth.getUser()).data.user;
      if (!user) throw new Error('You must be logged in to create subcategories');

      const { data, error } = await supabaseClient
        .from('subcategories')
        .insert({
          name: subCategory.name,
          category_id: subCategory.categoryId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newSubCategory = convertToSubCategory(data);
        set((state: State) => ({
          subcategories: [...state.subcategories, newSubCategory]
        }));
        return newSubCategory;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to create subcategory');
    }
  },
  
  updateCategory: async (id, updates) => {
    try {
      // Convert categoryId to category_id for database
      const dbUpdates = {
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.icon && { icon: updates.icon })
      };
      
      const { data, error } = await supabaseClient
        .from('categories')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedCategory = convertToCategory(data);
        set((state: State) => ({
          categories: state.categories.map((cat) => (cat.id === id ? updatedCategory : cat))
        }));
        return updatedCategory;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to update category');
    }
  },
  
  updateSubCategory: async (id, updates) => {
    try {
      // Convert categoryId to category_id for database
      const dbUpdates = {
        ...(updates.name && { name: updates.name }),
        ...(updates.categoryId && { category_id: updates.categoryId })
      };
      
      const { data, error } = await supabaseClient
        .from('subcategories')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedSubCategory = convertToSubCategory(data);
        set((state: State) => ({
          subcategories: state.subcategories.map((subcat) => (subcat.id === id ? updatedSubCategory : subcat))
        }));
        return updatedSubCategory;
      }
      return null;
    } catch (error: any) {
      return handleError(error, 'Failed to update subcategory');
    }
  },
  
  deleteCategory: async (id) => {
    try {
      // First delete all subcategories that belong to this category
      const subcategoriesToDelete = get().subcategories.filter(s => s.categoryId === id);
      for (const subcategory of subcategoriesToDelete) {
        await get().deleteSubCategory(subcategory.id);
      }
      
      // Then delete all expenses directly associated with this category
      const expensesToDelete = get().expenses.filter(e => e.categoryId === id);
      for (const expense of expensesToDelete) {
        await get().deleteExpense(expense.id);
      }
      
      // Finally delete the category itself
      const { error } = await supabaseClient.from('categories').delete().eq('id', id);

      if (error) throw error;

      // Update state to remove the deleted category
      set((state: State) => ({
        categories: state.categories.filter((cat) => cat.id !== id)
      }));
      
      toast.success('Category deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete category');
      throw error;
    }
  },
  
  deleteSubCategory: async (id) => {
    try {
      // First delete all expenses associated with this subcategory
      const expensesToDelete = get().expenses.filter(e => e.subcategoryId === id);
      for (const expense of expensesToDelete) {
        await get().deleteExpense(expense.id);
      }
      
      // Then delete the subcategory
      const { error } = await supabaseClient.from('subcategories').delete().eq('id', id);

      if (error) throw error;

      // Update state to remove the deleted subcategory
      set((state: State) => ({
        subcategories: state.subcategories.filter((subcat) => subcat.id !== id)
      }));
      
      toast.success('Subcategory deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete subcategory');
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const { data: categoriesData, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (categoriesData) {
        const categories = categoriesData.map(cat => convertToCategory(cat));
        set({ categories });
        
        // If no categories, create some default ones
        if (categories.length === 0) {
          const user = (await supabaseClient.auth.getUser()).data.user;
          if (user) {
            await Promise.all([
              get().createCategory({ name: 'Food', type: 'food', icon: 'Utensils' }),
              get().createCategory({ name: 'Home', type: 'home', icon: 'Home' }),
              get().createCategory({ name: 'Transportation', type: 'car', icon: 'Car' }),
              get().createCategory({ name: 'Shopping', type: 'misc', icon: 'ShoppingCart' }),
              get().createCategory({ name: 'Entertainment', type: 'misc', icon: 'Smile' })
            ]);
            
            // Fetch categories again after creating defaults
            const { data: newCategoriesData } = await supabaseClient
              .from('categories')
              .select('*')
              .order('name');
              
            if (newCategoriesData) {
              const newCategories = newCategoriesData.map(cat => convertToCategory(cat));
              set({ categories: newCategories });
              return newCategories;
            }
          }
        }
        
        return categories;
      }
      return [];
    } catch (error: any) {
      handleError(error, 'Failed to fetch categories');
      return [];
    }
  },

  fetchSubCategories: async () => {
    try {
      const { data: subCategoriesData, error } = await supabaseClient
        .from('subcategories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (subCategoriesData) {
        const subcategories = subCategoriesData.map(subcat => convertToSubCategory(subcat));
        set({ subcategories });
        
        // If no subcategories and we have categories, create some defaults
        if (subcategories.length === 0 && get().categories.length > 0) {
          const user = (await supabaseClient.auth.getUser()).data.user;
          if (user) {
            const categories = get().categories;
            
            // Create default subcategories for each category
            const createPromises = [];
            
            for (const category of categories) {
              if (category.type === 'food') {
                createPromises.push(
                  get().createSubCategory({ name: 'Restaurant', categoryId: category.id }),
                  get().createSubCategory({ name: 'Takeout', categoryId: category.id }),
                  get().createSubCategory({ name: 'Groceries', categoryId: category.id })
                );
              } else if (category.type === 'home') {
                createPromises.push(
                  get().createSubCategory({ name: 'Rent', categoryId: category.id }),
                  get().createSubCategory({ name: 'Utilities', categoryId: category.id }),
                  get().createSubCategory({ name: 'Furniture', categoryId: category.id })
                );
              } else if (category.type === 'car') {
                createPromises.push(
                  get().createSubCategory({ name: 'Gas', categoryId: category.id }),
                  get().createSubCategory({ name: 'Maintenance', categoryId: category.id }),
                  get().createSubCategory({ name: 'Parking', categoryId: category.id })
                );
              } else {
                createPromises.push(
                  get().createSubCategory({ name: 'General', categoryId: category.id })
                );
              }
            }
            
            await Promise.all(createPromises);
            
            // Fetch subcategories again after creating defaults
            const { data: newSubCategoriesData } = await supabaseClient
              .from('subcategories')
              .select('*')
              .order('name');
              
            if (newSubCategoriesData) {
              const newSubcategories = newSubCategoriesData.map(subcat => convertToSubCategory(subcat));
              set({ subcategories: newSubcategories });
              return newSubcategories;
            }
          }
        }
        
        return subcategories;
      }
      return [];
    } catch (error: any) {
      handleError(error, 'Failed to fetch subcategories');
      return [];
    }
  }
});
