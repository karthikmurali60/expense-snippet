import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  PieChart,
  Folder,
  Plus,
  Menu,
  X,
  DollarSign,
  Wallet,
  Target,
  LogOut,
  User,
  Trash,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useExpenseStore } from "@/lib/store";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { syncSplitwiseExpenses } from "@/integrations/splitwise/client";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { categories } = useExpenseStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };

    getUser();
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = "/"; // Redirect to login page
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncSplitwiseExpenses();
      toast.success("Successfully synced expenses from Splitwise");
    } catch (error) {
      console.error("Error syncing expenses:", error);
      if (error instanceof Error && error.message.includes('No previous sync time found')) {
        toast.error("Please set up Splitwise integration before syncing");
      } else {
        toast.error("Failed to sync expenses from Splitwise");
      }
    } finally {
      setIsSyncing(false);
    }
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
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ ease: "easeOut", duration: 0.2 }}
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
                    isActive("/")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
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
                    isActive("/statistics")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
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
                    isActive("/categories")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
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
                    isActive("/budgets")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
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
                    isActive("/goals")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Target className="h-5 w-5" />
                  <span>Goals</span>
                </Link>

                <Link
                  to="/add"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive("/add")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Expense</span>
                </Link>

                <Link
                  to="/upload-receipt"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive("/upload-receipt")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Receipt className="h-5 w-5" />
                  <span>Upload Receipt</span>
                </Link>

                

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isSyncing ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                  )}
                >
                  <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
                  <span>Sync Splitwise</span>
                </button>
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    isActive("/profile")
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
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
                isActive("/")
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
                isActive("/statistics")
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
                isActive("/categories")
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
                isActive("/budgets")
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
                isActive("/goals")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Target className="h-5 w-5" />
              <span>Goals</span>
            </Link>

            

            <Link
              to="/add"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive("/add")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Plus className="h-5 w-5" />
              <span>Add Expense</span>
            </Link>

            <Link
              to="/upload-receipt"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive("/upload-receipt")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <Receipt className="h-5 w-5" />
              <span>Upload Receipt</span>
            </Link>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isSyncing ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
              )}
            >
              <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
              <span>Sync Splitwise</span>
            </button>
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive("/profile")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent dark:hover:bg-accent/50 dark:text-foreground/90 dark:hover:text-foreground"
              )}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 container px-4 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
