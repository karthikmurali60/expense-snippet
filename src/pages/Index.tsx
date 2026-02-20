import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useExpenseStore } from "@/lib/store";
import type { ExpenseActions } from "@/lib/store/types";
import { formatCurrency, getCurrentMonth, getMonthName } from "@/lib/utils";
import { format, isWithinInterval } from "date-fns";
import { useNavigate } from "react-router-dom";
import ExpenseList from "@/components/ExpenseList";
import MonthSummary from "@/components/MonthSummary";
import FilterSection from "@/components/FilterSection";
import CategorySelector from "@/components/expense/CategorySelector";
import SubcategorySelector from "@/components/expense/SubcategorySelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { Expense } from "@/lib/types";
import { DateRange } from "react-day-picker";

const Index = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Re-categorize dialog state
  const [recategorizeDialogOpen, setRecategorizeDialogOpen] = useState(false);
  const [recategorizeIds, setRecategorizeIds] = useState<string[]>([]);
  const [recategorizeCategoryId, setRecategorizeCategoryId] = useState("");
  const [recategorizeSubcategoryId, setRecategorizeSubcategoryId] = useState("");

  const {
    expenses,
    categories,
    subcategories,
    getMonthlyExpenses,
    getMonthlyStatistics,
    bulkDeleteExpenses,
    bulkUpdateCategory,
  } = useExpenseStore();

  // Seed re-categorize dialog category when it opens
  useEffect(() => {
    if (recategorizeDialogOpen && categories.length > 0 && !recategorizeCategoryId) {
      setRecategorizeCategoryId(categories[0].id);
    }
  }, [recategorizeDialogOpen, categories, recategorizeCategoryId]);

  // Auto-select first subcategory when category changes in dialog
  useEffect(() => {
    if (recategorizeCategoryId) {
      const first = subcategories.find(
        (s) => s.categoryId === recategorizeCategoryId
      );
      setRecategorizeSubcategoryId(first?.id || "");
    }
  }, [recategorizeCategoryId, subcategories]);

  // Create our own date range filtering function
  const filterExpensesByDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) {
      return [];
    }

    return expenses.filter((expense) => {
      if (!(expense.date instanceof Date)) {
        console.error("Invalid date object:", expense);
        return false;
      }

      try {
        if (!dateRange.to) {
          return (
            format(expense.date, "yyyy-MM-dd") ===
            format(dateRange.from!, "yyyy-MM-dd")
          );
        }

        return isWithinInterval(expense.date, {
          start: dateRange.from!,
          end: dateRange.to,
        });
      } catch (error) {
        console.error("Error processing date:", error, expense);
        return false;
      }
    });
  };

  // Calculate statistics for date range
  const calculateDateRangeStatistics = (dateRange: DateRange | undefined) => {
    const rangeExpenses = filterExpensesByDateRange(dateRange);

    const totalAmount = rangeExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    const categoryTotals = rangeExpenses.reduce((acc, expense) => {
      const categoryId = expense.categoryId;
      acc[categoryId] = (acc[categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([id, total]) => {
        const category = categories.find((c) => c.id === id) || {
          name: "Unknown",
          type: "misc",
          icon: "Package",
          id,
        };
        return {
          id,
          name: category.name,
          total,
          color:
            category.type === "food"
              ? "red-500"
              : category.type === "home"
              ? "orange-500"
              : category.type === "car"
              ? "blue-500"
              : category.type === "groceries"
              ? "green-500"
              : category.type === "misc"
              ? "purple-500"
              : "pink-500",
        };
      })
      .sort((a, b) => Number(b.total) - Number(a.total));

    return { totalAmount, categoryBreakdown };
  };

  const isDateRangeActive = Boolean(dateRange?.from);

  const monthlyExpenses = isDateRangeActive
    ? filterExpensesByDateRange(dateRange)
    : getMonthlyExpenses(selectedMonth);

  const { totalAmount, categoryBreakdown } = isDateRangeActive
    ? calculateDateRangeStatistics(dateRange)
    : getMonthlyStatistics(selectedMonth);

  const filteredExpenses = monthlyExpenses.filter((expense) => {
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(expense.categoryId)
    ) {
      return false;
    }
    if (selectedSubcategory && expense.subcategoryId !== selectedSubcategory) {
      return false;
    }
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const category = categories.find((c) => c.id === expense.categoryId);
      const subcategory = subcategories.find(
        (s) => s.id === expense.subcategoryId
      );

      return (
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.amount.toString().includes(searchLower) ||
        category?.name.toLowerCase().includes(searchLower) ||
        subcategory?.name.toLowerCase().includes(searchLower) ||
        formatCurrency(expense.amount).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const selectedCategorySubcategoryTotal = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const availableSubcategories =
    selectedCategories.length > 0
      ? subcategories.filter((sub) =>
          selectedCategories.includes(sub.categoryId)
        )
      : [];

  const selectedCategoryName =
    selectedCategories.length === 1
      ? categories.find((c) => c.id === selectedCategories[0])?.name
      : selectedCategories.length > 1
      ? `Multiple Categories (${selectedCategories.length})`
      : null;

  const selectedSubcategoryName = selectedSubcategory
    ? subcategories.find((s) => s.id === selectedSubcategory)?.name
    : null;

  useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedCategories]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedMonth, dateRange?.from, dateRange?.to]);

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prevCategories) => {
      if (prevCategories.includes(categoryId)) {
        return prevCategories.filter((id) => id !== categoryId);
      } else {
        return [...prevCategories, categoryId];
      }
    });
    setIsSubcategoriesOpen(true);
  };

  const handleSubcategoryFilter = (subcategoryId: string) => {
    setSelectedSubcategory((prevId) =>
      prevId === subcategoryId ? null : subcategoryId
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategory(null);
    setIsSubcategoriesOpen(false);
    setSearchQuery("");
    setDateRange(undefined);
  };

  const handleAddExpense = () => {
    navigate("/add");
  };

  const handleEditExpense = (expense: Expense) => {
    navigate("/add", { state: { expense } });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteExpenses(ids);
  };

  const handleBulkRecategorize = (ids: string[]) => {
    setRecategorizeIds(ids);
    setRecategorizeCategoryId(categories[0]?.id || "");
    setRecategorizeSubcategoryId("");
    setRecategorizeDialogOpen(true);
  };

  const handleConfirmRecategorize = async () => {
    if (!recategorizeCategoryId || !recategorizeSubcategoryId) return;
    await bulkUpdateCategory(recategorizeIds, recategorizeCategoryId, recategorizeSubcategoryId);
    setRecategorizeDialogOpen(false);
    setRecategorizeIds([]);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your spending
        </p>
      </div>

      <MonthSummary
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        totalAmount={totalAmount}
        categoryBreakdown={categoryBreakdown}
        selectedCategorySubcategoryTotal={
          selectedCategories.length > 0
            ? selectedCategorySubcategoryTotal
            : undefined
        }
        selectedCategoryName={selectedCategoryName || undefined}
        selectedSubcategoryName={selectedSubcategoryName || undefined}
        dateRange={dateRange}
        isDateRangeActive={isDateRangeActive}
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <FilterSection
        categories={categories}
        categoryBreakdown={categoryBreakdown}
        selectedCategories={selectedCategories}
        handleCategoryFilter={handleCategoryFilter}
        selectedSubcategory={selectedSubcategory}
        handleSubcategoryFilter={handleSubcategoryFilter}
        availableSubcategories={availableSubcategories}
        isSubcategoriesOpen={isSubcategoriesOpen}
        setIsSubcategoriesOpen={setIsSubcategoriesOpen}
        clearFilters={clearFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isDateRangeActive={isDateRangeActive}
      />

      <ExpenseList
        isLoading={isLoading}
        filteredExpenses={filteredExpenses}
        categories={categories}
        subcategories={subcategories}
        selectedCategories={selectedCategories}
        selectedSubcategory={selectedSubcategory}
        handleAddExpense={handleAddExpense}
        handleEditExpense={handleEditExpense}
        onBulkDelete={handleBulkDelete}
        onBulkRecategorize={handleBulkRecategorize}
      />

      {/* Re-categorize dialog */}
      <Dialog open={recategorizeDialogOpen} onOpenChange={setRecategorizeDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Re-categorize {recategorizeIds.length} expense{recategorizeIds.length > 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <CategorySelector
              categories={categories}
              categoryId={recategorizeCategoryId}
              setCategoryId={setRecategorizeCategoryId}
              setSubcategoryId={setRecategorizeSubcategoryId}
            />
            <SubcategorySelector
              subcategories={subcategories}
              subcategoryId={recategorizeSubcategoryId}
              setSubcategoryId={setRecategorizeSubcategoryId}
              categoryId={recategorizeCategoryId}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecategorizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRecategorize}
              disabled={!recategorizeCategoryId || !recategorizeSubcategoryId}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
