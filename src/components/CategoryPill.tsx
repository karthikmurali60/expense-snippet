
import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Car, Home, ShoppingCart, Utensils, Plus, 
  Package, Zap, Gem, Shirt, CreditCard, Luggage, 
  Smile, CupSoda, Plane, Bus, Train, Building, 
  BookOpen, Award, Heart, Scissors, Headphones,
  Laptop, Smartphone, Pill, Dumbbell, PlaneTakeoff
} from 'lucide-react';
import { type CategoryType } from '@/lib/types';

type CategoryPillProps = {
  name: string;
  type?: CategoryType;
  icon: string;
  onClick?: () => void;
  selected?: boolean;
};

type IconMap = Record<string, React.ElementType>;

const iconMap: IconMap = {
  Car,
  Home,
  ShoppingCart,
  Utensils,
  Plus,
  Package,
  Zap,
  Gem,
  Shirt,
  CreditCard,
  Luggage,
  Smile,
  CupSoda,
  Plane,
  Bus,
  Train,
  Building,
  BookOpen,
  Award,
  Heart,
  Scissors,
  Headphones,
  Laptop,
  Smartphone,
  Pill,
  Dumbbell,
  PlaneTakeoff
};

const CategoryPill: React.FC<CategoryPillProps> = ({ name, type, icon, onClick, selected }) => {
  const IconComponent = iconMap[icon] || Package;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-secondary-foreground",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <IconComponent className="mr-2 h-4 w-4" />
      {name}
    </button>
  );
};

export default CategoryPill;
