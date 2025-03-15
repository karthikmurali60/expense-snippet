
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, BarChart, Tag, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TransitionWrapper from './TransitionWrapper';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import UserProfile from './UserProfile'; 

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const navLinks = [
    { to: '/', icon: <Home size={20} />, label: 'Home' },
    { to: '/add', icon: <PlusCircle size={20} />, label: 'Add' },
    { to: '/statistics', icon: <BarChart size={20} />, label: 'Stats' },
    { to: '/categories', icon: <Tag size={20} />, label: 'Categories' },
  ];
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/30 flex flex-col md:flex-row md:overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center">
          <button
            onClick={toggleMenu}
            className="rounded-full p-2 bg-secondary text-secondary-foreground"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-semibold">Expense Tracker</span>
          {user && <UserProfile user={user} />}
        </header>
      )}
      
      {/* Sidebar for Desktop or Mobile when menu is open */}
      <AnimatePresence mode="wait">
        {(!isMobile || menuOpen) && (
          <motion.aside
            initial={isMobile ? { x: '-100%' } : { opacity: 1 }}
            animate={isMobile ? { x: 0 } : { opacity: 1 }}
            exit={isMobile ? { x: '-100%' } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-background border-r overflow-y-auto",
              isMobile 
                ? "fixed inset-y-[56px] left-0 z-30 w-64" 
                : "sticky top-0 h-screen w-64 py-6"
            )}
          >
            {!isMobile && (
              <div className="p-4 flex justify-between items-center">
                <span className="font-semibold text-lg">Expense Tracker</span>
                {user && <UserProfile user={user} />}
              </div>
            )}
            
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    location.pathname === link.to 
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                  onClick={isMobile ? closeMenu : undefined}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Mobile backdrop */}
      {isMobile && menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-20 bg-black"
          onClick={closeMenu}
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        <TransitionWrapper>{children}</TransitionWrapper>
      </main>
    </div>
  );
};

export default Layout;
