
import React from 'react';
import { ChevronDown, ChevronUp, X, CalendarRange } from 'lucide-react';
import CategoryPill from '@/components/CategoryPill';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Category, Subcategory } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';

interface FilterSectionProps {
  categories: Category[];
  categoryBreakdown: Array<{
    id: string;
    total: number;
    color: string;
  }>;
  selectedCategories: string[];
  handleCategoryFilter: (categoryId: string) => void;
  selectedSubcategory: string | null;
  handleSubcategoryFilter: (subcategoryId: string) => void;
  availableSubcategories: Subcategory[];
  isSubcategoriesOpen: boolean;
  setIsSubcategoriesOpen: (isOpen: boolean) => void;
  clearFilters: () => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  isDateRangeActive: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  categories,
  categoryBreakdown,
  selectedCategories,
  handleCategoryFilter,
  selectedSubcategory,
  handleSubcategoryFilter,
  availableSubcategories,
  isSubcategoriesOpen,
  setIsSubcategoriesOpen,
  clearFilters,
  dateRange,
  setDateRange,
  isDateRangeActive
}) => {
  const [isDateRangeOpen, setIsDateRangeOpen] = React.useState(false);
  
  // Open the date range section automatically when a date is selected
  React.useEffect(() => {
    if (isDateRangeActive && !isDateRangeOpen) {
      setIsDateRangeOpen(true);
    }
  }, [isDateRangeActive, isDateRangeOpen]);
  
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
              selected={selectedCategories.includes(category.id)}
            />
          );
        })}
      </div>
      
      <div className="mt-4 grid gap-4">
        <Collapsible 
          open={isDateRangeOpen} 
          onOpenChange={setIsDateRangeOpen}
        >
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <CalendarRange className="mr-2 h-4 w-4" />
              Date Range Filter
              {isDateRangeOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </CollapsibleTrigger>
            
            {isDateRangeActive && (
              <button 
                onClick={() => setDateRange(undefined)}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="mr-1 h-3 w-3" />
                Clear date range
              </button>
            )}
          </div>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2">
              <Label htmlFor="date-range">Select date range</Label>
              <DateRangePicker 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange} 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      
        {selectedCategories.length > 0 && availableSubcategories.length > 0 && (
          <Collapsible 
            open={isSubcategoriesOpen} 
            onOpenChange={setIsSubcategoriesOpen}
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
      </div>
      
      {(selectedCategories.length > 0 || selectedSubcategory || isDateRangeActive) && (
        <button 
          onClick={clearFilters}
          className="flex items-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="mr-1 h-4 w-4" />
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default FilterSection;
