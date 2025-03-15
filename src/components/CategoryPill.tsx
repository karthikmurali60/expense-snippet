
import React from 'react';
import { cn, getCategoryColor } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface CategoryPillProps {
  type: string;
  name: string;
  icon: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const CategoryPill: React.FC<CategoryPillProps> = ({
  type,
  name,
  icon,
  onClick,
  active = false,
  className = '',
}) => {
  // Dynamic icon component
  const IconComponent = (Icons as Record<string, LucideIcon>)[icon] || Icons.Circle;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium',
        getCategoryColor(type),
        active ? 'text-white ring-2 ring-white/30 shadow-lg' : 'text-white/90',
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default',
        className
      )}
    >
      <IconComponent className="h-4 w-4" />
      <span>{name}</span>
    </button>
  );
};

export default CategoryPill;
