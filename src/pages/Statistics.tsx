import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName, exportToExcel, getPreviousMonth } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';
import { motion } from 'framer-motion';
import { DownloadIcon, PieChart, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, parseISO, subMonths } from 'date-fns';

// Define category colors for consistency
const CATEGORY_COLORS = {
  food: 'hsl(350 70% 55%)',    // Red
  home: 'hsl(25 90% 55%)',     // Orange
  car: 'hsl(200 80% 60%)',     // Blue
  groceries: 'hsl(130 50% 50%)', // Green
  misc: 'hsl(270 60% 60%)',    // Purple
};

const Statistics = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [compareMode, setCompareMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const { 
    getMonthlyExpenses, 
    getMonthlyStatistics,
    categories,
    subcategories
  } = useExpenseStore();
  
  const expenses = getMonthlyExpenses(selectedMonth);
  const { totalAmount, categoryBreakdown } = getMonthlyStatistics(selectedMonth);
  
  // Get previous month data for comparison
  const previousMonth = getPreviousMonth(selectedMonth);
  const { totalAmount: prevTotalAmount, categoryBreakdown: prevCategoryBreakdown } = getMonthlyStatistics(previousMonth);

  // Calculate month-over-month change
  const monthChange = totalAmount - prevTotalAmount;
  const monthChangePercent = prevTotalAmount > 0 
    ? ((monthChange / prevTotalAmount) * 100).toFixed(1) 
    : '0';
  
  // Prepare data for the pie chart with better colors
  const chartData = categoryBreakdown
    .filter(cat => cat.total > 0)
    .map(cat => {
      const categoryType = categories.find(c => c.id === cat.id)?.type || 'misc';
      return {
        name: cat.name,
        value: cat.total,
        color: CATEGORY_COLORS[categoryType] || '#8E9196'  // Default to gray if type not found
      };
    });
  
  // Get spending insights by comparing with previous month
  const getCategoryInsight = (categoryId) => {
    const currentCat = categoryBreakdown.find(cat => cat.id === categoryId);
    const prevCat = prevCategoryBreakdown.find(cat => cat.id === categoryId);
    
    if (!currentCat || !prevCat) return null;
    
    const change = currentCat.total - prevCat.total;
    const changePercent = prevCat.total > 0 
      ? ((change / prevCat.total) * 100).toFixed(1) 
      : '0';
    
    return {
      change,
      changePercent,
      increased: change > 0,
      decreased: change < 0,
      unchanged: change === 0
    };
  };

  // Calculate subcategory breakdown for each category
  const getSubcategoryBreakdown = (categoryId) => {
    const categoryExpenses = expenses.filter(expense => expense.categoryId === categoryId);
    const subcategoryTotals = {};
    
    // Calculate total for each subcategory
    categoryExpenses.forEach(expense => {
      if (!subcategoryTotals[expense.subcategoryId]) {
        subcategoryTotals[expense.subcategoryId] = 0;
      }
      subcategoryTotals[expense.subcategoryId] += expense.amount;
    });
    
    // Convert to array with names
    const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return Object.entries(subcategoryTotals).map(([subcatId, total]) => {
      const subcategory = subcategories.find(sc => sc.id === subcatId);
      const percentage = categoryTotal > 0 ? ((total as number) / categoryTotal * 100).toFixed(1) : '0';
      
      return {
        id: subcatId,
        name: subcategory?.name || 'Unknown',
        total: total as number,
        percentage
      };
    }).sort((a, b) => b.total - a.total);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const handleExport = async () => {
    try {
      await exportToExcel(
        expenses, 
        categories, 
        subcategories, 
        selectedMonth,
        // Add previous month data for comparison
        {
          previousMonth,
          totalAmount,
          prevTotalAmount,
          monthChange,
          categoryBreakdown,
          prevCategoryBreakdown,
          getMonthlyExpenses
        }
      );
      toast.success('Exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">Analyze your monthly spending</p>
      </div>
      
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onChange={setSelectedMonth} 
      />
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-5 mb-6"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total for {getMonthName(selectedMonth)}</p>
            <h2 className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</h2>
            
            {/* Add month-over-month comparison */}
            <div className="flex items-center mt-2">
              <div className={`flex items-center ${monthChange > 0 ? 'text-red-500' : monthChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                {monthChange > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : monthChange < 0 ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : (
                  <Minus className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {monthChange !== 0 ? (
                    `${monthChange > 0 ? '+' : ''}${formatCurrency(monthChange)} (${monthChangePercent}%)`
                  ) : (
                    'No change'
                  )}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-2">vs. {getMonthName(previousMonth)}</span>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            disabled={expenses.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
        
        {expenses.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={200}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']} 
                  contentStyle={{ 
                    borderRadius: '0.5rem', 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <PieChart className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No data available</h3>
            <p className="text-muted-foreground mt-1">
              Add some expenses to see statistics
            </p>
          </div>
        )}
      </motion.div>
      
      <div className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        
        {categoryBreakdown.length > 0 ? (
          <div className="space-y-4">
            {categoryBreakdown
              .sort((a, b) => b.total - a.total)
              .map((category) => {
                const percentage = totalAmount > 0
                  ? ((category.total / totalAmount) * 100).toFixed(1)
                  : '0';
                
                // Get insights for this category
                const insight = getCategoryInsight(category.id);
                const categoryType = categories.find(c => c.id === category.id)?.type || 'misc';
                const categoryColor = CATEGORY_COLORS[categoryType] || '#8E9196';
                const isExpanded = expandedCategories[category.id];
                const subcategoryData = isExpanded ? getSubcategoryBreakdown(category.id) : [];
                
                return (
                  <div key={category.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center font-medium hover:text-primary focus:outline-none"
                      >
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4 mr-1" /> : 
                          <ChevronRight className="h-4 w-4 mr-1" />
                        }
                        <span>{category.name}</span>
                      </button>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">{formatCurrency(category.total)}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                    </div>
                    
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ backgroundColor: categoryColor }}
                        className="h-full"
                      />
                    </div>
                    
                    {/* Add insight for this category */}
                    {insight && (
                      <div className={`flex items-center text-xs mt-1 ${
                        insight.increased ? 'text-red-500' : 
                        insight.decreased ? 'text-green-500' : 
                        'text-gray-500'
                      }`}>
                        {insight.increased ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span>+{formatCurrency(insight.change)} ({insight.changePercent}%) vs last month</span>
                          </>
                        ) : insight.decreased ? (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            <span>{formatCurrency(insight.change)} ({insight.changePercent}%) vs last month</span>
                          </>
                        ) : (
                          <>
                            <Minus className="h-3 w-3 mr-1" />
                            <span>No change vs last month</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Subcategory breakdown */}
                    {isExpanded && subcategoryData.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="pl-6 mt-2 pt-2 border-l-2 space-y-2"
                        style={{ borderColor: categoryColor }}
                      >
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Subcategories</h4>
                        
                        {subcategoryData.map(subcat => (
                          <div key={subcat.id} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span>{subcat.name}</span>
                              <div className="flex items-baseline gap-2">
                                <span className="font-medium">{formatCurrency(subcat.total)}</span>
                                <span className="text-xs text-muted-foreground">{subcat.percentage}%</span>
                              </div>
                            </div>
                            
                            <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subcat.percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                style={{ backgroundColor: categoryColor }}
                                className="h-full opacity-70"
                              />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            No expense data available
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Statistics;
