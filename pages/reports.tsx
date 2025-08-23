import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  CreditCard,
  PieChart,
  BarChart,
  LineChart,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Chart from '../components/Chart';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatDate } from '../lib/utils';
import { Expense, Income, EMI } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export default function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const { user } = useAuth();
  const userId = user?._id || '';

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  const fetchData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      let startDate: Date, endDate: Date;
      
      if (selectedPeriod === 'month') {
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0);
      } else if (selectedPeriod === 'quarter') {
        const quarterStartMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, quarterStartMonth, 1);
        endDate = new Date(selectedYear, quarterStartMonth + 3, 0);
      } else {
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
      }

      const [expensesRes, incomeRes, emiRes] = await Promise.all([
        fetch(`/api/expenses/list?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/income/list?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/emi/list?userId=${userId}`)
      ]);

      const expensesData = await expensesRes.json();
      const incomeData = await incomeRes.json();
      const emiData = await emiRes.json();

      setExpenses(expensesData);
      setIncome(incomeData);
      setEmis(emiData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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

  const getEMIChartData = () => {
    return emis.map(emi => ({
      name: emi.name,
      value: emi.amount,
      monthsRemaining: emi.monthsRemaining,
      dueDay: emi.dueDay
    }));
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

  const getQuarterlyData = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map((quarter, index) => {
      const quarterStartMonth = index * 3;
      const quarterEndMonth = quarterStartMonth + 2;
      
      const quarterExpenses = expenses.filter(exp => {
        const expMonth = new Date(exp.date).getMonth();
        return expMonth >= quarterStartMonth && expMonth <= quarterEndMonth;
      });
      
      const quarterIncome = income.filter(inc => {
        const incMonth = new Date(inc.date).getMonth();
        return incMonth >= quarterStartMonth && incMonth <= quarterEndMonth;
      });
      
      return {
        name: quarter,
        expenses: quarterExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        income: quarterIncome.reduce((sum, inc) => sum + inc.amount, 0)
      };
    });
  };

  const getEMIStatus = () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return emis.map(emi => {
      const isDue = currentDay >= emi.dueDay;
      const status = isDue ? 'overdue' : 'upcoming';
      const daysUntilDue = isDue ? 0 : emi.dueDay - currentDay;
      
      return {
        ...emi,
        status,
        daysUntilDue,
        isDue
      };
    }).sort((a, b) => {
      if (a.isDue && !b.isDue) return -1;
      if (!a.isDue && b.isDue) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const totalEMI = emis.reduce((sum, emi) => sum + emi.amount, 0);
  const netAmount = totalIncome - totalExpenses - totalEMI;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses - totalEMI) / totalIncome) * 100 : 0;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

  return (
    <>
      <Head>
        <title>Finance Tracker - Reports</title>
        <meta name="description" content="Comprehensive financial reports and analytics" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
        {/* Header */}
        <PageHeader 
          title="Financial Reports" 
          subtitle="Comprehensive analytics & insights" 
          logo="/image_no_bg.png"
          gradient="blue"
        />

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Analysis Period</h2>
                <p className="text-gray-600 text-sm">Select the time period for your financial analysis</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'overview'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'detailed'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart className="w-4 h-4 inline mr-2" />
                  Detailed
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'month'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPeriod('quarter')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'quarter'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setSelectedPeriod('year')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === 'year'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yearly
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {selectedPeriod === 'month' && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                )}
                
                {selectedPeriod === 'quarter' && (
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {quarterNames.map((quarter, index) => (
                      <option key={index} value={index + 1}>{quarter}</option>
                    ))}
                  </select>
                )}
                
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading data...</span>
              </div>
            )}
          </div>

          {/* Quick Summary Card */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Financial Summary</h3>
              <div className="text-right">
                <p className="text-primary-100 text-sm">
                  {selectedPeriod === 'month' ? monthNames[selectedMonth] : 
                   selectedPeriod === 'quarter' ? quarterNames[selectedQuarter - 1] : 
                   selectedYear}
                </p>
                <p className="text-primary-200 text-xs">Current Period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-primary-200 text-sm">Income</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="text-center">
                <p className="text-primary-200 text-sm">Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-primary-200 text-sm">Net</p>
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(netAmount)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary-500">
              <div className="flex justify-between items-center">
                <span className="text-primary-200 text-sm">Savings Rate</span>
                <span className="font-bold text-lg">{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-primary-500 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
                </div>
                <TrendingUp className="text-green-200" size={32} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <TrendingDown className="text-red-200" size={32} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">EMI Payments</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEMI)}</p>
                </div>
                <CreditCard className="text-purple-200" size={32} />
              </div>
            </div>
            
            <div className={`rounded-2xl p-6 shadow-lg text-white ${
              netAmount >= 0 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Net Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(netAmount)}</p>
                  <p className="text-xs text-blue-200 mt-1">
                    {savingsRate.toFixed(1)}% of income
                  </p>
                </div>
                <BarChart3 className="text-blue-200" size={32} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense by Category */}
            {expenses.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Expenses by Category</h3>
                  <PieChart className="text-primary-600" size={20} />
                </div>
                <Chart data={getCategoryChartData()} type="pie" height={250} />
              </div>
            )}

            {/* Payment Mode Distribution */}
            {expenses.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
                  <BarChart className="text-primary-600" size={20} />
                </div>
                <Chart data={getPaymentModeChartData()} type="bar" height={250} />
              </div>
            )}
          </div>

          {/* EMI Status */}
          {emis.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">EMI Payment Status</h3>
                <CreditCard className="text-primary-600" size={20} />
              </div>
              
              <div className="space-y-3">
                {getEMIStatus().map((emi) => (
                  <div key={emi._id} className={`p-4 rounded-xl border-l-4 ${
                    emi.isDue 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {emi.isDue ? (
                          <AlertCircle className="text-red-500" size={20} />
                        ) : (
                          <CheckCircle className="text-green-500" size={20} />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{emi.name}</h4>
                          <p className="text-sm text-gray-600">
                            Due: {emi.dueDay}th of every month
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(emi.amount)}</p>
                        <p className={`text-sm ${
                          emi.isDue ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {emi.isDue ? 'Overdue' : `${emi.daysUntilDue} days left`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emi.monthsRemaining} months remaining
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Insights */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Financial Insights</h3>
              <Target className="text-primary-600" size={20} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Savings Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg">Savings Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Savings Rate</span>
                    <span className="font-bold text-blue-600">{savingsRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Income to Expense Ratio</span>
                    <span className="font-bold text-green-600">
                      {totalIncome > 0 ? (totalExpenses / totalIncome * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700">EMI to Income Ratio</span>
                    <span className="font-bold text-purple-600">
                      {totalIncome > 0 ? (totalEMI / totalIncome * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-lg">Budget Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-700">50/30/20 Rule</span>
                    <span className="text-xs text-gray-500">Needs/Wants/Savings</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Needs (50%)</span>
                      <span className="font-medium">
                        {totalIncome > 0 ? formatCurrency(totalIncome * 0.5) : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Wants (30%)</span>
                      <span className="font-medium">
                        {totalIncome > 0 ? formatCurrency(totalIncome * 0.3) : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Savings (20%)</span>
                      <span className="font-medium">
                        {totalIncome > 0 ? formatCurrency(totalIncome * 0.2) : '₹0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">💡 Smart Recommendations</h4>
              <div className="space-y-2 text-sm text-blue-800">
                {savingsRate < 20 && (
                  <p>• Consider reducing expenses to increase your savings rate above 20%</p>
                )}
                {totalEMI / totalIncome > 0.4 && (
                  <p>• Your EMI payments are high. Consider consolidating loans or refinancing</p>
                )}
                {totalExpenses / totalIncome > 0.8 && (
                  <p>• Your expenses are consuming most of your income. Look for areas to cut back</p>
                )}
                {savingsRate >= 30 && (
                  <p>• Excellent savings rate! Consider investing your surplus for better returns</p>
                )}
                {getEMIStatus().some(emi => emi.isDue) && (
                  <p>• You have overdue EMI payments. Prioritize these to avoid penalties</p>
                )}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedPeriod === 'month' ? 'Monthly' : selectedPeriod === 'quarter' ? 'Quarterly' : 'Yearly'} Trend Analysis
              </h3>
              <LineChart className="text-primary-600" size={20} />
            </div>
            
            {/* Chart Visualization */}
            <div className="mb-6">
              <Chart 
                data={selectedPeriod === 'month' ? getMonthlyTrendData() : getQuarterlyData()} 
                type="dual-line" 
                height={250} 
              />
            </div>
            
            {/* Detailed Breakdown */}
            <div className="space-y-4">
              {(selectedPeriod === 'month' ? getMonthlyTrendData() : getQuarterlyData()).map((period) => (
                <div key={period.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-900 text-lg">{period.name}</span>
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Income:</span>
                        <span className="font-bold text-green-600">{formatCurrency(period.income)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Expenses:</span>
                        <span className="font-bold text-red-600">{formatCurrency(period.expenses)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Net: {formatCurrency(period.income - period.expenses)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed View */}
          {viewMode === 'detailed' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Detailed Transaction List</h3>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Download className="w-4 h-4 inline mr-2" />
                  Export
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Recent Expenses */}
                {expenses.slice(0, 10).map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="text-red-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{expense.category}</h4>
                        <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                        {expense.note && <p className="text-xs text-gray-500">{expense.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-{formatCurrency(expense.amount)}</p>
                      <p className="text-sm text-gray-500">{expense.paymentMode}</p>
                    </div>
                  </div>
                ))}
                
                {/* Recent Income */}
                {income.slice(0, 10).map((inc) => (
                  <div key={inc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{inc.source}</h4>
                        <p className="text-sm text-gray-600">{formatDate(inc.date)}</p>
                        {inc.note && <p className="text-xs text-gray-500">{inc.note}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{formatCurrency(inc.amount)}</p>
                      <p className="text-sm text-gray-500">Income</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
