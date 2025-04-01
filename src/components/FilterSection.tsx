
import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import CategoryPill from '@/components/CategoryPill';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Category, Subcategory } from '@/lib/types';

interface FilterSectionProps {
  categories: Category[];
  categoryBreakdown: Array<{
    id: string;
    total: number;
    color: string;
  }>;
  selectedCategory: string | null;
  handleCategoryFilter: (categoryId: string) => void;
  selectedSubcategory: string | null;
  handleSubcategoryFilter: (subcategoryId: string) => void;
  availableSubcategories: Subcategory[];
  isSubcategoriesOpen: boolean;
  setIsSubcategoriesOpen: (isOpen: boolean) => void;
  clearFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  categories,
  categoryBreakdown,
  selectedCategory,
  handleCategoryFilter,
  selectedSubcategory,
  handleSubcategoryFilter,
  availableSubcategories,
  isSubcategoriesOpen,
  setIsSubcategoriesOpen,
  clearFilters
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mt-4">
        {categories.map((category) => {
          const amount = categoryBreakdown.find(c => c.id === category.id)?.total || 0;
          if (amount === 0) return null;
          
          return (
            <CategoryPill 
              key={category.id}
              type={category.type}
              name={category.name}
              icon={category.icon}
              onClick={() => handleCategoryFilter(category.id)}
              selected={selectedCategory === category.id}
            />
          );
        })}
      </div>
      
      {selectedCategory && availableSubcategories.length > 0 && (
        <Collapsible 
          open={isSubcategoriesOpen} 
          onOpenChange={setIsSubcategoriesOpen}
          className="mt-4"
        >
          <CollapsibleTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Subcategories
            {isSubcategoriesOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-2 mt-2">
              {availableSubcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryFilter(subcategory.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedSubcategory === subcategory.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {(selectedCategory || selectedSubcategory) && (
        <button 
          onClick={clearFilters}
          className="flex items-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
};

export default FilterSection;
