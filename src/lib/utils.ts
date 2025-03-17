
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subMonths, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { Expense, Category, Subcategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const prevMonth = subMonths(date, 1);
  return format(prevMonth, 'yyyy-MM');
}

export function getMonthName(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return format(date, 'MMMM yyyy');
}

export async function exportToExcel(
  expenses: Expense[],
  categories: Category[],
  subcategories: Subcategory[],
  month: string,
  comparisonData?: any
) {
  // Map categories and subcategories for easier lookup
  const categoryMap = new Map<string, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  
  const subcategoryMap = new Map<string, Subcategory>();
  subcategories.forEach(subcat => subcategoryMap.set(subcat.id, subcat));
  
  // Transform expenses for export
  const excelData = expenses.map(expense => {
    const category = categoryMap.get(expense.categoryId);
    const subcategory = subcategoryMap.get(expense.subcategoryId);
    
    return {
      "Date": formatDate(expense.date),
      "Amount": expense.amount,
      "Description": expense.description,
      "Category": category?.name || "Unknown",
      "Subcategory": subcategory?.name || "Unknown"
    };
  });

  // Create expenses worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for expenses worksheet
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 10 }, // Amount
    { wch: 30 }, // Description
    { wch: 15 }, // Category
    { wch: 15 }  // Subcategory
  ];
  worksheet["!cols"] = columnWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Expenses ${getMonthName(month)}`);
  
  // Create category summary worksheet
  if (comparisonData) {
    // Create category summary data
    const categorySummary = comparisonData.categoryBreakdown.map(cat => {
      const prevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === cat.id);
      const change = prevCat ? cat.total - prevCat.total : cat.total;
      const changePercent = prevCat && prevCat.total > 0 
        ? ((change / prevCat.total) * 100).toFixed(1) 
        : 'N/A';
      
      return {
        "Category": cat.name,
        "Current Month": cat.total,
        "Previous Month": prevCat ? prevCat.total : 0,
        "Change": change,
        "Change %": changePercent !== 'N/A' ? `${changePercent}%` : changePercent
      };
    });
    
    // Add total row
    categorySummary.push({
      "Category": "TOTAL",
      "Current Month": comparisonData.totalAmount,
      "Previous Month": comparisonData.prevTotalAmount,
      "Change": comparisonData.monthChange,
      "Change %": comparisonData.prevTotalAmount > 0 
        ? `${((comparisonData.monthChange / comparisonData.prevTotalAmount) * 100).toFixed(1)}%` 
        : 'N/A'
    });
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(categorySummary);
    
    // Set column widths for summary worksheet
    const summaryColumnWidths = [
      { wch: 20 }, // Category
      { wch: 15 }, // Current Month
      { wch: 15 }, // Previous Month
      { wch: 15 }, // Change
      { wch: 10 }  // Change %
    ];
    summaryWorksheet["!cols"] = summaryColumnWidths;
    
    // Add summary worksheet
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Category Summary");
    
    // Create subcategory summary data
    const subcategorySummaryData = [];
    
    // Group expenses by subcategory for current month
    const currentSubcategoryTotals = expenses.reduce((acc, expense) => {
      const key = `${expense.categoryId}-${expense.subcategoryId}`;
      if (!acc[key]) {
        acc[key] = {
          categoryId: expense.categoryId,
          subcategoryId: expense.subcategoryId,
          total: 0
        };
      }
      acc[key].total += expense.amount;
      return acc;
    }, {});
    
    // Group expenses by subcategory for previous month
    const prevMonthExpenses = comparisonData ? 
      comparisonData.getMonthlyExpenses ? comparisonData.getMonthlyExpenses(comparisonData.previousMonth) : [] 
      : [];
    
    const prevSubcategoryTotals = prevMonthExpenses.reduce((acc, expense) => {
      const key = `${expense.categoryId}-${expense.subcategoryId}`;
      if (!acc[key]) {
        acc[key] = {
          categoryId: expense.categoryId,
          subcategoryId: expense.subcategoryId,
          total: 0
        };
      }
      acc[key].total += expense.amount;
      return acc;
    }, {});
    
    // Create subcategory summary entries
    Object.entries(currentSubcategoryTotals).forEach(([key, data]) => {
      const category = categoryMap.get(data.categoryId);
      const subcategory = subcategoryMap.get(data.subcategoryId);
      
      if (category && subcategory) {
        const prevData = prevSubcategoryTotals[key];
        const currentTotal = data.total;
        const prevTotal = prevData ? prevData.total : 0;
        const change = currentTotal - prevTotal;
        const changePercent = prevTotal > 0 ? ((change / prevTotal) * 100).toFixed(1) : 'N/A';
        
        subcategorySummaryData.push({
          "Category": category.name,
          "Subcategory": subcategory.name,
          "Current Month": currentTotal,
          "Previous Month": prevTotal,
          "Change": change,
          "Change %": changePercent !== 'N/A' ? `${changePercent}%` : changePercent
        });
      }
    });
    
    // Sort by category and subcategory
    subcategorySummaryData.sort((a, b) => {
      if (a.Category === b.Category) {
        return a.Subcategory.localeCompare(b.Subcategory);
      }
      return a.Category.localeCompare(b.Category);
    });
    
    if (subcategorySummaryData.length > 0) {
      const subcatWorksheet = XLSX.utils.json_to_sheet(subcategorySummaryData);
      
      // Set column widths for subcategory worksheet
      const subcatColumnWidths = [
        { wch: 20 }, // Category
        { wch: 20 }, // Subcategory
        { wch: 15 }, // Current Month
        { wch: 15 }, // Previous Month
        { wch: 15 }, // Change
        { wch: 10 }  // Change %
      ];
      subcatWorksheet["!cols"] = subcatColumnWidths;
      
      // Add subcategory worksheet
      XLSX.utils.book_append_sheet(workbook, subcatWorksheet, "Subcategory Details");
    }
    
    // Create insights worksheet
    const insights = [
      { "Insight": "Monthly Overview", "Details": `Your total spending for ${getMonthName(month)} was ${formatCurrency(comparisonData.totalAmount)}.` },
      { "Insight": "Month-over-Month Change", "Details": comparisonData.monthChange > 0 
        ? `Your spending increased by ${formatCurrency(comparisonData.monthChange)} (${((comparisonData.monthChange / comparisonData.prevTotalAmount) * 100).toFixed(1)}%) compared to last month.`
        : comparisonData.monthChange < 0
        ? `Your spending decreased by ${formatCurrency(Math.abs(comparisonData.monthChange))} (${Math.abs(((comparisonData.monthChange / comparisonData.prevTotalAmount) * 100)).toFixed(1)}%) compared to last month.`
        : `Your spending remained the same as last month.`
      }
    ];
    
    // Add top categories
    const topCategories = comparisonData.categoryBreakdown
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      const topCategoriesText = topCategories
        .map(cat => `${cat.name} (${formatCurrency(cat.total)})`)
        .join(", ");
      
      insights.push({ 
        "Insight": "Top Spending Categories", 
        "Details": `Your top spending categories were ${topCategoriesText}.` 
      });
    }
    
    // Add categories with significant increases
    const increasedCategories = comparisonData.categoryBreakdown
      .filter(cat => {
        const prevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === cat.id);
        if (!prevCat || prevCat.total === 0) return false;
        const change = cat.total - prevCat.total;
        const changePercent = (change / prevCat.total) * 100;
        return changePercent > 20; // More than 20% increase
      })
      .sort((a, b) => {
        const aPrevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === a.id);
        const bPrevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === b.id);
        const aChangePercent = aPrevCat ? ((a.total - aPrevCat.total) / aPrevCat.total) * 100 : 0;
        const bChangePercent = bPrevCat ? ((b.total - bPrevCat.total) / bPrevCat.total) * 100 : 0;
        return bChangePercent - aChangePercent;
      });
    
    if (increasedCategories.length > 0) {
      const increasesText = increasedCategories
        .map(cat => {
          const prevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === cat.id);
          const change = cat.total - prevCat.total;
          const changePercent = ((change / prevCat.total) * 100).toFixed(1);
          return `${cat.name} (+${changePercent}%)`;
        })
        .join(", ");
      
      insights.push({ 
        "Insight": "Significant Increases", 
        "Details": `You had significant spending increases in: ${increasesText}.` 
      });
    }
    
    // Add categories with significant decreases
    const decreasedCategories = comparisonData.categoryBreakdown
      .filter(cat => {
        const prevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === cat.id);
        if (!prevCat || prevCat.total === 0) return false;
        const change = cat.total - prevCat.total;
        const changePercent = (change / prevCat.total) * 100;
        return changePercent < -20; // More than 20% decrease
      })
      .sort((a, b) => {
        const aPrevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === a.id);
        const bPrevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === b.id);
        const aChangePercent = aPrevCat ? ((a.total - aPrevCat.total) / aPrevCat.total) * 100 : 0;
        const bChangePercent = bPrevCat ? ((b.total - bPrevCat.total) / bPrevCat.total) * 100 : 0;
        return aChangePercent - bChangePercent;
      });
    
    if (decreasedCategories.length > 0) {
      const decreasesText = decreasedCategories
        .map(cat => {
          const prevCat = comparisonData.prevCategoryBreakdown.find(c => c.id === cat.id);
          const change = cat.total - prevCat.total;
          const changePercent = ((change / prevCat.total) * 100).toFixed(1);
          return `${cat.name} (${changePercent}%)`;
        })
        .join(", ");
      
      insights.push({ 
        "Insight": "Significant Decreases", 
        "Details": `You reduced spending in: ${decreasesText}.` 
      });
    }
    
    const insightsWorksheet = XLSX.utils.json_to_sheet(insights);
    
    // Set column widths for insights worksheet
    const insightsColumnWidths = [
      { wch: 25 }, // Insight
      { wch: 70 }, // Details
    ];
    insightsWorksheet["!cols"] = insightsColumnWidths;
    
    // Add insights worksheet
    XLSX.utils.book_append_sheet(workbook, insightsWorksheet, "Spending Insights");
  }
  
  // Generate Excel file
  XLSX.writeFile(workbook, `Expenses_${month}.xlsx`);
}

export function getCategoryColor(type: string): string {
  switch (type) {
    case 'car': return 'bg-expense-car';
    case 'groceries': return 'bg-expense-groceries';
    case 'home': return 'bg-expense-home';
    case 'food': return 'bg-expense-food';
    case 'misc': return 'bg-expense-misc';
    default: return 'bg-gray-400';
  }
}
