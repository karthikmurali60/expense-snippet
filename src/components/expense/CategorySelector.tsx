
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Category } from '@/lib/types';

interface CategorySelectorProps {
  categories: Category[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  setSubcategoryId: (id: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  categories, 
  categoryId, 
  setCategoryId,
  setSubcategoryId
}) => {
  return (
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
  );
};

export default CategorySelector;
