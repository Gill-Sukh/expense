import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, X, Minus, LogOut, User } from 'lucide-react';
import BottomNav from './BottomNav';
import Chart from './Chart';
import { formatCurrency } from '../lib/utils';
import { Expense, Income, PaymentAccount, DashboardStats, EMI } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalIncome: 0,
    netAmount: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
    monthlyNet: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string>('');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    paymentMode: 'Cash',
    bankAccount: '',
    note: '',
    source: '',
    date: new Date().toISOString().split('T')[0], // Today's date as default
    isRecurring: false,
    recurringType: 'monthly' as 'monthly' | 'yearly'
  });

  const { user, logout } = useAuth();
  const userId = user?._id || '';

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch expenses
      const expensesRes = await fetch(`/api/expenses/list?userId=${userId}`);
      const expensesData = await expensesRes.json();
      setExpenses(expensesData);

      // Fetch income
      const incomeRes = await fetch(`/api/income/list?userId=${userId}`);
      const incomeData = await incomeRes.json();
      setIncome(incomeData);

      // Fetch accounts
      const accountsRes = await fetch(`/api/accounts/list?userId=${userId}`);
      const accountsData = await accountsRes.json();
      setAccounts(accountsData);

      // Fetch EMIs
      const emiRes = await fetch(`/api/emi/list?userId=${userId}`);
      const emiData = await emiRes.json();
      setEmis(emiData);

      calculateStats(expensesData, incomeData, emiData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateStats = (expensesData: Expense[], incomeData: Income[], emiData: EMI[] = []) => {
    const totalExpenses = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomeData.reduce((sum, inc) => sum + inc.amount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate monthly expenses including recurring ones
    let monthlyExpenses = 0;
    expensesData.forEach(exp => {
      const expDate = new Date(exp.date);
      const expMonth = expDate.getMonth();
      const expYear = expDate.getFullYear();
      
      // One-time expenses in current month
      if (expMonth === currentMonth && expYear === currentYear) {
        monthlyExpenses += exp.amount;
      }
      
      // Recurring monthly expenses (add to all months)
      if (exp.isRecurring && exp.recurringType === 'monthly') {
        monthlyExpenses += exp.amount;
      }
      
      // Recurring yearly expenses (add if in current year)
      if (exp.isRecurring && exp.recurringType === 'yearly' && expYear === currentYear) {
        monthlyExpenses += exp.amount;
      }
    });
    
    // Add EMIs to monthly expenses (they are monthly recurring)
    console.log('EMI data for monthly calculation:', emiData);
    emiData.forEach(emi => {
      if (emi.monthsRemaining > 0) {
        console.log(`Adding EMI ${emi.name} with amount ${emi.amount} to monthly expenses`);
        monthlyExpenses += emi.amount;
      }
    });
    console.log('Final monthly expenses after EMIs:', monthlyExpenses);
    
    // Calculate monthly income including recurring ones
    let monthlyIncome = 0;
    incomeData.forEach(inc => {
      const incDate = new Date(inc.date);
      const incMonth = incDate.getMonth();
      const incYear = incDate.getFullYear();
      
      // One-time income in current month
      if (incMonth === currentMonth && incYear === currentYear) {
        monthlyIncome += inc.amount;
      }
      
      // Recurring monthly income (add to all months)
      if (inc.isRecurring && inc.recurringType === 'monthly') {
        monthlyIncome += inc.amount;
      }
      
      // Recurring yearly income (add if in current year)
      if (inc.isRecurring && inc.recurringType === 'yearly' && incYear === currentYear) {
        monthlyIncome += inc.amount;
      }
    });

    setStats({
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      monthlyExpenses,
      monthlyIncome,
      monthlyNet: monthlyIncome - monthlyExpenses
    });
  };

  const getExpenseChartData = () => {
    const categoryMap = new Map<string, number>();
    
    // Add regular expenses
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    // Add EMIs as a separate category
    emis.forEach(emi => {
      if (emi.monthsRemaining > 0) {
        const current = categoryMap.get(`EMI - ${emi.name}`) || 0;
        categoryMap.set(`EMI - ${emi.name}`, current + emi.amount);
      }
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const recentExpenses = expenses.slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let endpoint: string;
      let method: string;
      
      if (isEditing && addType === 'expense') {
        endpoint = `/api/expenses/edit/${editingId}`;
        method = 'PUT';
      } else {
        endpoint = addType === 'expense' ? '/api/expenses/add' : '/api/income/add';
        method = 'POST';
      }

      const payload = addType === 'expense' 
        ? {
            userId,
            amount: parseFloat(formData.amount),
            category: formData.category,
            paymentMode: formData.paymentMode,
            bankAccount: formData.bankAccount || null,
            note: formData.note,
            date: new Date(formData.date).toISOString(),
            isRecurring: formData.isRecurring,
            recurringType: formData.isRecurring ? formData.recurringType : null
          }
        : {
            userId,
            amount: parseFloat(formData.amount),
            source: formData.source,
            note: formData.note,
            date: new Date(formData.date).toISOString(),
            isRecurring: formData.isRecurring,
            recurringType: formData.isRecurring ? formData.recurringType : null
          };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ amount: '', category: '', paymentMode: 'Cash', bankAccount: '', note: '', source: '', date: new Date().toISOString().split('T')[0], isRecurring: false, recurringType: 'monthly' });
        setIsEditing(false);
        setEditingId('');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding/editing record:', error);
    }
  };

  const editExpense = (expense: Expense) => {
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      paymentMode: expense.paymentMode,
      bankAccount: expense.bankAccount || '',
      note: expense.note || '',
      source: '',
      date: new Date(expense.date).toISOString().split('T')[0],
      isRecurring: expense.isRecurring || false,
      recurringType: expense.recurringType || 'monthly'
    });
    setAddType('expense');
    setIsEditing(true);
    setEditingId(expense._id);
    setShowAddModal(true);
  };

  const deleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/delete/${expenseId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchData(); // Refresh data
        } else {
          console.error('Failed to delete expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', category: '', paymentMode: 'Cash', bankAccount: '', note: '', source: '', date: new Date().toISOString().split('T')[0], isRecurring: false, recurringType: 'monthly' });
    setShowAddModal(false);
    setIsEditing(false);
    setEditingId('');
  };

  return (
    <>
      <Head>
        <title>FinanceFlow - Dashboard</title>
        <meta name="description" content="Track your daily expenses and income" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Simple Header */}
        <div className="bg-white border-b px-4 py-3">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">FinanceFlow</h1>
              <p className="text-sm text-gray-500">Hello, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Modern Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 shadow-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(stats.monthlyIncome)}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <TrendingUp className="text-white" size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 shadow-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-800">
                    {formatCurrency(stats.monthlyExpenses)}
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-full">
                  <TrendingDown className="text-white" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Modern Balance Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 p-2 rounded-full">
                <DollarSign className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-blue-900">Balance Overview</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                <span className="text-blue-700 font-medium">Total Income</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                <span className="text-blue-700 font-medium">Total Expenses</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(stats.totalExpenses)}</span>
              </div>
              <div className="h-px bg-blue-200"></div>
              <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl">
                <span className="text-blue-900 font-bold text-lg">Net Balance</span>
                <span className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Modern Monthly Summary */}
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Calendar className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold">This Month</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm opacity-90 mb-1">Income</p>
                <p className="text-xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm opacity-90 mb-1">Expenses</p>
                <p className="text-xl font-bold">{formatCurrency(stats.monthlyExpenses)}</p>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Net</span>
                <span className={`text-lg font-bold ${stats.monthlyNet >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {formatCurrency(stats.monthlyNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Modern Quick Actions */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-500 p-2 rounded-full">
                <Plus className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setAddType('expense');
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Minus size={20} className="mr-2" />
                <span className="font-semibold">Add Expense</span>
              </button>
              <button
                onClick={() => {
                  setAddType('income');
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                <span className="font-semibold">Add Income</span>
              </button>
            </div>
          </div>

          {/* Modern Expense Chart */}
          {(expenses.length > 0 || emis.length > 0) && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-2xl p-6 shadow-lg border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500 p-2 rounded-full">
                  <CreditCard className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-orange-900">Expense Breakdown</h2>
              </div>
              <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm">
                <Chart data={getExpenseChartData()} type="pie" height={200} />
              </div>
            </div>
          )}

          {/* Active EMIs Section */}
          {emis.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 shadow-lg border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500 p-2 rounded-full">
                  <CreditCard className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-amber-900">Active EMIs</h2>
              </div>
              <div className="space-y-3">
                {emis.filter(emi => emi.monthsRemaining > 0).map((emi) => (
                  <div key={emi._id} className="bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-amber-900 text-lg">{emi.name}</p>
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {emi.monthsRemaining} months left
                      </span>
                    </div>
                    <div className="text-sm text-amber-700 mb-2">
                      <p className="flex items-center gap-2">
                        <span className="bg-amber-200 px-2 py-1 rounded-full text-xs">Due: {emi.dueDay}th</span>
                        <span className="bg-amber-200 px-2 py-1 rounded-full text-xs">Monthly</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-amber-600">
                        Started: {new Date(emi.startDate).toLocaleDateString()}
                      </p>
                      <p className="font-bold text-amber-800 text-lg">
                        ₹{emi.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modern Recent Expenses */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-500 p-2 rounded-full">
                <TrendingDown className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Recent Expenses</h2>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense._id} className="bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 text-lg">{expense.category}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editExpense(expense)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(expense._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      <p className="flex items-center gap-2">
                        <span className="bg-slate-200 px-2 py-1 rounded-full text-xs">{expense.paymentMode}</span>
                        {expense.bankAccount && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{expense.bankAccount}</span>
                        )}
                      </p>
                      {expense.isRecurring && (
                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                          <span className="animate-spin">🔄</span> {expense.recurringType} recurring
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      <p className="font-bold text-red-600 text-lg">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="text-slate-500" size={24} />
                </div>
                <p className="text-slate-500 font-medium">No expenses yet</p>
                <p className="text-slate-400 text-sm">Start tracking your expenses!</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button - Always Add Expense */}
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={() => {
              setAddType('expense');
              setShowAddModal(true);
            }}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 transform hover:scale-105"
            title="Add Expense"
          >
            <Minus size={24} />
          </button>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-gray-900">
                   {isEditing ? 'Edit' : 'Add'} {addType === 'expense' ? 'Expense' : 'Income'}
                 </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Amount
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       required
                       value={formData.amount}
                       onChange={(e) => setFormData({...formData, amount: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Date
                     </label>
                     <input
                       type="date"
                       required
                       value={formData.date}
                       onChange={(e) => setFormData({...formData, date: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     />
                   </div>
                 </div>
                
                {addType === 'expense' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Bills">Bills</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Payment Mode
                       </label>
                       <select
                         required
                         value={formData.paymentMode}
                         onChange={(e) => setFormData({...formData, paymentMode: e.target.value, bankAccount: ''})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       >
                         <option value="Cash">Cash</option>
                         <option value="UPI">UPI</option>
                         <option value="Credit Card">Credit Card</option>
                         <option value="Debit Card">Debit Card</option>
                       </select>
                     </div>
                     
                     {/* Bank Account Details for UPI, Credit Card, Debit Card */}
                     {(formData.paymentMode === 'UPI' || formData.paymentMode === 'Credit Card') && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           {formData.paymentMode === 'UPI' ? 'Select UPI ID / Bank Account' : 'Select Bank Account'}
                         </label>
                         <select
                           required
                           value={formData.bankAccount}
                           onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                         >
                           <option value="">Select Account</option>
                           {accounts
                             .filter(account => account.type === formData.paymentMode)
                             .map(account => (
                               <option key={account._id} value={account.details}>
                                 {account.name} ({account.details})
                               </option>
                             ))}
                         </select>
                       </div>
                     )}
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <select
                      required
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Source</option>
                      <option value="Salary">Salary</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Investment">Investment</option>
                      <option value="Business">Business</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
                
                                     {/* Recurring Options */}
                     <div className="space-y-3">
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="isRecurring"
                           checked={formData.isRecurring}
                           onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                           className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                         />
                         <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                           Recurring {addType === 'expense' ? 'Expense' : 'Income'}
                         </label>
                       </div>
                       
                       {formData.isRecurring && (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Recurring Type
                           </label>
                           <select
                             value={formData.recurringType}
                             onChange={(e) => setFormData({...formData, recurringType: e.target.value as 'monthly' | 'yearly'})}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                           >
                             <option value="monthly">Monthly</option>
                             <option value="yearly">Yearly</option>
                           </select>
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Note (Optional)
                       </label>
                       <textarea
                         value={formData.note}
                         onChange={(e) => setFormData({...formData, note: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                         rows={3}
                         placeholder="Add a note..."
                       />
                     </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                                     <button
                     type="submit"
                     className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                   >
                     {isEditing ? 'Update' : 'Add'} {addType === 'expense' ? 'Expense' : 'Income'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </>
  );
}
