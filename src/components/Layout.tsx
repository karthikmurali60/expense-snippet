
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ListPlus, BarChart3, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/add', icon: ListPlus, label: 'Add Expense' },
    { path: '/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/categories', icon: Settings, label: 'Categories' },
  ];
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container mx-auto max-w-md px-4 pb-20 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-10">
        <div className="glass border-t border-border py-2 px-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className="flex flex-col items-center py-1 px-3 relative"
                >
                  <div className="relative">
                    <Icon 
                      size={22} 
                      className={`${isActive ? 'text-primary' : 'text-muted-foreground'} transition-colors`} 
                    />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
