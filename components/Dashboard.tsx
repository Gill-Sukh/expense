import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, X, Minus, LogOut, User } from 'lucide-react';
import BottomNav from './BottomNav';
import Chart from './Chart';
import ConfirmModal from './ConfirmModal';
import TransactionModal from './TransactionModal';
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
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete-expense' | 'delete-emi' | 'delete-account'; id: string; name: string } | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Expense | Income | null>(null);
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

  useEffect(() => {
    console.log('Accounts:', accounts);
  }, [accounts]);

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
    
    // Add EMIs to total expenses
    const totalEmiAmount = emiData.reduce((sum, emi) => {
      const remainingMonths = calculateRemainingMonths(emi.startDate, emi.monthsRemaining);
      return remainingMonths > 0 ? sum + emi.amount : sum;
    }, 0);
    const totalExpensesWithEmi = totalExpenses + totalEmiAmount;
    
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
      const remainingMonths = calculateRemainingMonths(emi.startDate, emi.monthsRemaining);
      if (remainingMonths > 0) {
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
      totalExpenses: totalExpensesWithEmi,
      totalIncome,
      netAmount: totalIncome - totalExpensesWithEmi,
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
      const remainingMonths = calculateRemainingMonths(emi.startDate, emi.monthsRemaining);
      if (remainingMonths > 0) {
        const current = categoryMap.get(`EMI - ${emi.name}`) || 0;
        categoryMap.set(`EMI - ${emi.name}`, current + emi.amount);
      }
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account ? account.name : '';
  };

  const calculateRemainingMonths = (startDate: string | Date, totalMonths: number) => {
    const start = new Date(startDate);
    const today = new Date();
    
    // Calculate how many months have passed since start
    const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    
    // Calculate remaining months
    const remaining = totalMonths - monthsPassed;
    
    // Return 0 if EMI is completed, otherwise return remaining months
    return Math.max(0, remaining);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

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
        showToast(`${addType === 'expense' ? 'Expense' : 'Income'} added/updated successfully!`, 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to add/update record.', 'error');
      }
    } catch (error) {
      console.error('Error adding/editing record:', error);
      showToast('An unexpected error occurred.', 'error');
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
    setConfirmAction({ type: 'delete-expense', id: expenseId, name: 'expense' });
    setShowConfirmModal(true);
  };

  const deleteEMI = async (emiId: string) => {
    setConfirmAction({ type: 'delete-emi', id: emiId, name: 'EMI' });
    setShowConfirmModal(true);
  };

  const deleteAccount = async (accountId: string) => {
    setConfirmAction({ type: 'delete-account', id: accountId, name: 'account' });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      let endpoint: string;
      
      switch (confirmAction.type) {
        case 'delete-expense':
          endpoint = `/api/expenses/delete/${confirmAction.id}`;
          break;
        case 'delete-emi':
          endpoint = `/api/emi/delete/${confirmAction.id}`;
          break;
        case 'delete-account':
          endpoint = `/api/accounts/delete/${confirmAction.id}`;
          break;
        default:
          throw new Error('Invalid delete type');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setShowConfirmModal(false);
        setConfirmAction(null);
        fetchData(); // Refresh data
        showToast(`${confirmAction.name} deleted successfully!`, 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || `Failed to delete ${confirmAction.name}.`, 'error');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast('An unexpected error occurred.', 'error');
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

        {/* Toast Notification Banner */}
        {toast.show && (
          <div className={`w-full py-3 px-4 shadow-lg ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-red-500 to-rose-600'
          } text-white`}>
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  toast.type === 'success' ? 'bg-green-200' : 'bg-red-200'
                }`}></div>
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Quick Balance Overview */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium opacity-90">This Month</h2>
                <p className="text-3xl font-bold">{formatCurrency(stats.monthlyNet)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Calendar className="text-white" size={24} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm opacity-80 mb-1">Income</p>
                <p className="text-lg font-bold">{formatCurrency(stats.monthlyIncome)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm opacity-80 mb-1">Expenses</p>
                <p className="text-lg font-bold">{formatCurrency(stats.monthlyExpenses)}</p>
              </div>
            </div>
          </div>

          {/* Active EMIs - Only show if there are active EMIs */}
          {emis.filter(emi => calculateRemainingMonths(emi.startDate, emi.monthsRemaining) > 0).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500 p-2 rounded-full">
                  <CreditCard className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Active EMIs</h2>
              </div>
              <div className="space-y-3">
                {emis.filter(emi => calculateRemainingMonths(emi.startDate, emi.monthsRemaining) > 0).map((emi) => (
                  <div key={emi._id} className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-amber-900">{emi.name}</p>
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {calculateRemainingMonths(emi.startDate, emi.monthsRemaining)} months
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-amber-700">Due: {emi.dueDay}th monthly</p>
                      <p className="font-bold text-amber-800 text-lg">
                        ₹{emi.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
              <div className="bg-slate-100 p-2 rounded-full">
                <TrendingDown className="text-slate-600" size={20} />
              </div>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense._id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setSelectedTransaction(expense);
                      setShowTransactionModal(true);
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{expense.category}</p>
                      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-red-600 text-lg">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 font-medium">No expenses yet</p>
                <p className="text-gray-400 text-sm">Start tracking your expenses!</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button - Smart Add Button */}
        <div className="fixed bottom-20 right-4 z-50">
          <div className="flex flex-col items-end space-y-3">
            {/* Quick Add Income Button */}
            <button
              onClick={() => {
                setAddType('income');
                setShowAddModal(true);
              }}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl border-2 border-white"
              title="Quick Add Income"
            >
              <Plus size={18} />
            </button>
            
            {/* Main FAB - Expense */}
            <button
              onClick={() => {
                setAddType('expense');
                setShowAddModal(true);
              }}
              className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl border-2 border-white"
              title="Quick Add Expense"
            >
              <Minus size={18} />
            </button>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-gray-900">
                   {isEditing ? 'Transaction Details' : 'Add'} {addType === 'expense' ? 'Expense' : 'Income'}
                 </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                 {/* Action buttons for editing */}
                 {isEditing && addType === 'expense' && (
                   <div className="flex gap-3 mb-4">
                     <button
                       type="button"
                       onClick={() => {
                         setIsEditing(false);
                         setEditingId('');
                         setFormData({ amount: '', category: '', paymentMode: 'Cash', bankAccount: '', note: '', source: '', date: new Date().toISOString().split('T')[0], isRecurring: false, recurringType: 'monthly' });
                       }}
                       className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                       Edit Transaction
                     </button>
                     <button
                       type="button"
                       onClick={() => deleteExpense(editingId)}
                       className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                       Delete Transaction
                     </button>
                   </div>
                 )}
                 
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
                     {accounts.length > 0 && (formData.paymentMode === 'UPI' || formData.paymentMode === 'Credit Card') && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           {formData.paymentMode === 'UPI' ? 'Select UPI ID / Bank Account' : 'Select Bank Account'}
                           {formData.bankAccount && (
                             <span className="text-sm text-gray-500 ml-2">
                               Selected: {getAccountName(formData.bankAccount)}
                             </span>
                           )}
                         </label>
                         <select
                           required
                           value={formData.bankAccount}
                           onChange={(e) => {
                            const selectedValue = e.target.value;
                            console.log('Selected value:', selectedValue);
                            setFormData({...formData, bankAccount: selectedValue});
                            console.log('Updated formData:', {...formData, bankAccount: selectedValue});
                          }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                         >
                           <option value="">Select Account</option>
                           {accounts
                             .filter(account => account.type === formData.paymentMode)
                             .map(account => {
                               console.log('Account:', account);
                               return (
                                 <option key={account._id} value={account._id}>
                                   {account.name} {account.details ? `(${account.details})` : ''}
                                 </option>
                               );
                             })}
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

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleConfirmAction}
            title={`Confirm Deletion`}
            message={`Are you sure you want to delete this ${confirmAction.name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
          />
        )}

        {/* Transaction Details Modal */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          transaction={selectedTransaction}
          accounts={accounts}
          onEdit={(transaction) => {
            setShowTransactionModal(false);
            if ('category' in transaction) {
              setFormData({
                amount: transaction.amount.toString(),
                category: transaction.category,
                paymentMode: transaction.paymentMode,
                bankAccount: transaction.bankAccount || '',
                note: transaction.note || '',
                source: '',
                date: new Date(transaction.date).toISOString().split('T')[0],
                isRecurring: transaction.isRecurring || false,
                recurringType: transaction.recurringType || 'monthly'
              });
              setAddType('expense');
              setIsEditing(true);
              setEditingId(transaction._id);
              setShowAddModal(true);
            }
          }}
          onDelete={(transactionId) => {
            setShowTransactionModal(false);
            deleteExpense(transactionId);
          }}
        />

        <BottomNav />
        
      </div>
    </>
  );
}
