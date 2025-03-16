
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ children, className, isOpen, onClose }: SidebarProps) => {
  const isMobile = useMobile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className={cn(
              "fixed top-0 bottom-0 right-0 z-50 w-[280px] border-l border-border bg-background p-6 shadow-lg",
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
