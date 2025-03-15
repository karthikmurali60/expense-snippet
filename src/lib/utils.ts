
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
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

export function getMonthName(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return format(date, 'MMMM yyyy');
}

export async function exportToExcel(
  expenses: Expense[],
  categories: Category[],
  subcategories: Subcategory[],
  month: string
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
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
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
  XLSX.utils.book_append_sheet(workbook, worksheet, getMonthName(month));
  
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
