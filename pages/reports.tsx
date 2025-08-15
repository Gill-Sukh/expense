import { useState, useEffect } from 'react';
import Head from 'next/head';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Chart from '../components/Chart';
import { formatCurrency } from '../lib/utils';
import { Expense, Income } from '../lib/types';

export default function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Mock user ID - in real app, get from auth
  const userId = 'user123';

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();

      const [expensesRes, incomeRes] = await Promise.all([
        fetch(`/api/expenses/list?userId=${userId}&startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/income/list?userId=${userId}&startDate=${startDate}&endDate=${endDate}`)
      ]);

      const expensesData = await expensesRes.json();
      const incomeData = await incomeRes.json();

      setExpenses(expensesData);
      setIncome(incomeData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getCategoryChartData = () => {
    const categoryMap = new Map<string, number>();
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getPaymentModeChartData = () => {
    const modeMap = new Map<string, number>();
    expenses.forEach(expense => {
      const current = modeMap.get(expense.paymentMode) || 0;
      modeMap.set(expense.paymentMode, current + expense.amount);
    });
    
    return Array.from(modeMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getMonthlyTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => {
      const monthExpenses = expenses.filter(exp => new Date(exp.date).getMonth() === index);
      const monthIncome = income.filter(inc => new Date(inc.date).getMonth() === index);
      
      return {
        name: month,
        expenses: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        income: monthIncome.reduce((sum, inc) => sum + inc.amount, 0)
      };
    });
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const netAmount = totalIncome - totalExpenses;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <>
      <Head>
        <title>Finance Tracker - Reports</title>
        <meta name="description" content="Financial reports and analytics" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Analytics and insights</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Period</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPeriod === 'month'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setSelectedPeriod('year')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPeriod === 'year'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>

            {selectedPeriod === 'month' ? (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <TrendingUp className="text-success-500 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Income</p>
              <p className="text-lg font-bold text-success-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <TrendingDown className="text-danger-500 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-lg font-bold text-danger-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm text-center">
              <BarChart3 className="text-primary-500 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Net</p>
              <p className={`text-lg font-bold ${netAmount >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatCurrency(netAmount)}
              </p>
            </div>
          </div>

          {/* Expense by Category */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
              <Chart data={getCategoryChartData()} type="pie" height={250} />
            </div>
          )}

          {/* Payment Mode Distribution */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Mode Distribution</h2>
              <Chart data={getPaymentModeChartData()} type="bar" height={200} />
            </div>
          )}

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h2>
            <div className="space-y-3">
              {getMonthlyTrendData().map((month) => (
                <div key={month.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{month.name}</span>
                  <div className="text-right">
                    <p className="text-sm text-success-600">+{formatCurrency(month.income)}</p>
                    <p className="text-sm text-danger-600">-{formatCurrency(month.expenses)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
