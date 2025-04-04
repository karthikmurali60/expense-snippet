
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Subcategory } from '@/lib/types';

interface SubcategorySelectorProps {
  subcategories: Subcategory[];
  subcategoryId: string;
  setSubcategoryId: (id: string) => void;
  categoryId: string;
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({ 
  subcategories, 
  subcategoryId, 
  setSubcategoryId,
  categoryId
}) => {
  const filteredSubcategories = subcategories.filter(
    subcat => subcat.categoryId === categoryId
  );
  
  if (!categoryId || filteredSubcategories.length === 0) return null;
  
  return (
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
  );
};

export default SubcategorySelector;
