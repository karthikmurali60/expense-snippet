
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useExpenseStore } from '@/lib/store';
import { formatCurrency, getCurrentMonth, getMonthName, exportToExcel } from '@/lib/utils';
import MonthSelector from '@/components/MonthSelector';
import { motion } from 'framer-motion';
import { DownloadIcon, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Statistics = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  const { 
    getMonthlyExpenses, 
    getMonthlyStatistics,
    categories,
    subcategories
  } = useExpenseStore();
  
  const expenses = getMonthlyExpenses(selectedMonth);
  const { totalAmount, categoryBreakdown } = getMonthlyStatistics(selectedMonth);
  
  const chartData = categoryBreakdown
    .filter(cat => cat.total > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.total,
      color: `var(--expense-${cat.color.split('-')[1]})`
    }));
  
  const handleExport = async () => {
    try {
      await exportToExcel(expenses, categories, subcategories, selectedMonth);
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total for {getMonthName(selectedMonth)}</p>
            <h2 className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</h2>
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
                
                return (
                  <div key={category.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.name}</span>
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
                        className={`h-full bg-${category.color}`}
                      />
                    </div>
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
