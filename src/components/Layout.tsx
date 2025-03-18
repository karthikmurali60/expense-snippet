
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, PieChart, Folder, Plus, Menu, X, 
  DollarSign, Wallet, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useExpenseStore } from '@/lib/store';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { categories } = useExpenseStore();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center px-4">
          <div className="flex w-full justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="text-lg font-semibold">ExpenseTrack</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Side drawer for mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
              className="fixed top-0 right-0 z-50 h-full w-2/3 border-l bg-background p-6 shadow-lg md:hidden"
            >
              <div className="flex justify-end mb-6">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                <Link 
                  to="/"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive('/') ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                
                <Link 
                  to="/statistics"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive('/statistics') ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <PieChart className="h-5 w-5" />
                  <span>Statistics</span>
                </Link>
                
                <Link 
                  to="/categories"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive('/categories') ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Folder className="h-5 w-5" />
                  <span>Categories</span>
                </Link>
                
                <Link 
                  to="/budgets"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive('/budgets') ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Budgets</span>
                </Link>
                
                <Link 
                  to="/goals"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive('/goals') ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Target className="h-5 w-5" />
                  <span>Goals</span>
                </Link>
                
                <Link 
                  to="/add"
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Expense</span>
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r px-4 py-6">
          <nav className="space-y-2">
            <Link 
              to="/"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive('/') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            
            <Link 
              to="/statistics"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive('/statistics') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <PieChart className="h-5 w-5" />
              <span>Statistics</span>
            </Link>
            
            <Link 
              to="/categories"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive('/categories') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Folder className="h-5 w-5" />
              <span>Categories</span>
            </Link>
            
            <Link 
              to="/budgets"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive('/budgets') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <DollarSign className="h-5 w-5" />
              <span>Budgets</span>
            </Link>
            
            <Link 
              to="/goals"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive('/goals') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Target className="h-5 w-5" />
              <span>Goals</span>
            </Link>
            
            <div className="pt-2">
              <Link 
                to="/add"
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full"
              >
                <Plus className="h-5 w-5" />
                <span>Add Expense</span>
              </Link>
            </div>
          </nav>
        </aside>
        
        {/* Page content */}
        <main className="flex-1 container px-4 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
