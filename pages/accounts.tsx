import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, X, CreditCard, Building2, Wallet, TrendingUp, TrendingDown, Edit, Trash2, RefreshCw } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../lib/utils';
import { PaymentAccount, EMI, Expense, Income } from '../lib/types';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_MODES, RECURRING_TYPES } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';

export default function Accounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<Expense[]>([]);
  const [recurringIncome, setRecurringIncome] = useState<Income[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddEMI, setShowAddEMI] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'expense' | 'income'>('expense');
  const [isEditingEMI, setIsEditingEMI] = useState(false);
  const [editingEMIId, setEditingEMIId] = useState<string>('');
  const [isEditingRecurring, setIsEditingRecurring] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ 
    type: 'delete-emi' | 'delete-account' | 'delete-recurring-expense' | 'delete-recurring-income'; 
    id: string; 
    name: string 
  } | null>(null);
  const [accountForm, setAccountForm] = useState({
    type: 'Cash',
    name: '',
    details: ''
  });
  const [emiForm, setEmiForm] = useState({
    name: '',
    amount: '',
    startDate: '',
    dueDay: '',
    monthsRemaining: '',
    paymentAccountId: ''
  });
  const [recurringForm, setRecurringForm] = useState({
    amount: '',
    category: '',
    source: '',
    paymentMode: 'Cash',
    bankAccount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    recurringType: 'monthly' as 'monthly' | 'yearly'
  });

  const { user } = useAuth();
  const userId = user?._id || '';

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const [accountsRes, emisRes, expensesRes, incomeRes] = await Promise.all([
        fetch(`/api/accounts/list?userId=${userId}`),
        fetch(`/api/emi/list?userId=${userId}`),
        fetch(`/api/expenses/list?userId=${userId}`),
        fetch(`/api/income/list?userId=${userId}`)
      ]);

      const accountsData = await accountsRes.json();
      const emisData = await emisRes.json();
      const expensesData = await expensesRes.json();
      const incomeData = await incomeRes.json();

      // Filter recurring transactions
      const recurringExpensesData = expensesData.filter((exp: Expense) => exp.isRecurring);
      const recurringIncomeData = incomeData.filter((inc: Income) => inc.isRecurring);

      setAccounts(accountsData);
      setEmis(emisData);
      setRecurringExpenses(recurringExpensesData);
      setRecurringIncome(recurringIncomeData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Credit Card':
        return <CreditCard size={20} />;
      case 'UPI':
        return <Wallet size={20} />; // Changed from Smartphone to Wallet
      case 'Cash':
        return <Building2 size={20} />; // Changed from DollarSign to Building2
      case 'Debit Card':
        return <CreditCard size={20} />;
      default:
        return <CreditCard size={20} />;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'Credit Card':
        return 'text-blue-600 bg-blue-50';
      case 'UPI':
        return 'text-green-600 bg-green-50';
      case 'Cash':
        return 'text-yellow-600 bg-yellow-50';
      case 'Debit Card':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getUpcomingEMIs = () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return emis.filter(emi => {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), emi.dueDay);
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      return dueDate.getDate() <= currentDay + 7; // Next 7 days
    });
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

  const upcomingEMIs = getUpcomingEMIs();

  const editEMI = (emi: EMI) => {
    setEmiForm({
      name: emi.name,
      amount: emi.amount.toString(),
      startDate: new Date(emi.startDate).toISOString().split('T')[0],
      dueDay: emi.dueDay.toString(),
      monthsRemaining: emi.monthsRemaining.toString(),
      paymentAccountId: emi.paymentAccountId
    });
    setIsEditingEMI(true);
    setEditingEMIId(emi._id);
    setShowAddEMI(true);
  };

  const deleteEMI = async (emiId: string) => {
    setConfirmAction({ type: 'delete-emi', id: emiId, name: emis.find(emi => emi._id === emiId)?.name || 'this EMI' });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      let endpoint: string;
      
      console.log('Attempting to delete:', confirmAction.type, 'with ID:', confirmAction.id);
      
      switch (confirmAction.type) {
        case 'delete-emi':
          endpoint = `/api/emi/delete/${confirmAction.id}`;
          break;
        case 'delete-account':
          endpoint = `/api/accounts/delete/${confirmAction.id}`;
          break;
        case 'delete-recurring-expense':
          endpoint = `/api/expenses/delete/${confirmAction.id}`;
          break;
        case 'delete-recurring-income':
          endpoint = `/api/income/delete/${confirmAction.id}`;
          break;
        default:
          throw new Error('Invalid delete type');
      }

      console.log('Making DELETE request to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Delete successful');
        setShowConfirmModal(false);
        setConfirmAction(null);
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(errorData.message || `Failed to delete ${confirmAction.name}.`);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('An unexpected error occurred.');
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please log in to add accounts');
      return;
    }
    
    try {
      const response = await fetch('/api/accounts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: accountForm.type,
          name: accountForm.name,
          details: accountForm.details
        })
      });

      if (response.ok) {
        setShowAddAccount(false);
        setAccountForm({ type: 'Cash', name: '', details: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleAddEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please log in to add EMIs');
      return;
    }
    
    try {
      let endpoint: string;
      let method: string;
      
      if (isEditingEMI) {
        endpoint = `/api/emi/edit/${editingEMIId}`;
        method = 'PUT';
      } else {
        endpoint = '/api/emi/add';
        method = 'POST';
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: emiForm.name,
          amount: parseFloat(emiForm.amount),
          startDate: emiForm.startDate,
          dueDay: parseInt(emiForm.dueDay),
          monthsRemaining: parseInt(emiForm.monthsRemaining),
          paymentAccountId: emiForm.paymentAccountId
        })
      });

      if (response.ok) {
        setShowAddEMI(false);
        setEmiForm({ name: '', amount: '', startDate: '', dueDay: '', monthsRemaining: '', paymentAccountId: '' });
        setIsEditingEMI(false);
        setEditingEMIId('');
        fetchData();
      }
    } catch (error) {
      console.error('Error adding/editing EMI:', error);
    }
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please log in to add recurring transactions');
      return;
    }
    
    try {
      let endpoint: string;
      let method: string;
      
      if (isEditingRecurring) {
        endpoint = recurringType === 'expense' 
          ? `/api/expenses/edit/${editingRecurringId}`
          : `/api/income/edit/${editingRecurringId}`;
        method = 'PUT';
      } else {
        endpoint = recurringType === 'expense' ? '/api/expenses/add' : '/api/income/add';
        method = 'POST';
      }

      const payload = recurringType === 'expense' 
        ? {
            userId,
            amount: parseFloat(recurringForm.amount),
            category: recurringForm.category,
            paymentMode: recurringForm.paymentMode,
            bankAccount: recurringForm.bankAccount || null,
            note: recurringForm.note,
            date: new Date(recurringForm.date).toISOString(),
            isRecurring: true,
            recurringType: recurringForm.recurringType
          }
        : {
            userId,
            amount: parseFloat(recurringForm.amount),
            source: recurringForm.source,
            note: recurringForm.note,
            date: new Date(recurringForm.date).toISOString(),
            isRecurring: true,
            recurringType: recurringForm.recurringType
          };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddRecurring(false);
        resetRecurringForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error adding/editing recurring transaction:', error);
    }
  };

  const editRecurring = (transaction: Expense | Income) => {
    const isExpense = 'category' in transaction;
    setRecurringType(isExpense ? 'expense' : 'income');
    setRecurringForm({
      amount: transaction.amount.toString(),
      category: isExpense ? transaction.category : '',
      source: isExpense ? '' : transaction.source,
      paymentMode: isExpense ? transaction.paymentMode : 'Cash',
      bankAccount: isExpense ? (transaction.bankAccount || '') : '',
      note: transaction.note || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
      recurringType: transaction.recurringType || 'monthly'
    });
    setIsEditingRecurring(true);
    setEditingRecurringId(transaction._id);
    setShowAddRecurring(true);
  };

  const deleteRecurring = async (transactionId: string, type: 'expense' | 'income') => {
    console.log('deleteRecurring called with:', { transactionId, type });
    setConfirmAction({ 
      type: type === 'expense' ? 'delete-recurring-expense' : 'delete-recurring-income', 
      id: transactionId, 
      name: `recurring ${type}` 
    });
    setShowConfirmModal(true);
  };

  const resetAccountForm = () => {
    setAccountForm({ type: 'Cash', name: '', details: '' });
    setShowAddAccount(false);
  };

  const resetEMIForm = () => {
    setEmiForm({ name: '', amount: '', startDate: '', dueDay: '', monthsRemaining: '', paymentAccountId: '' });
    setShowAddEMI(false);
    setIsEditingEMI(false);
    setEditingEMIId('');
  };

  const resetRecurringForm = () => {
    setRecurringForm({
      amount: '',
      category: '',
      source: '',
      paymentMode: 'Cash',
      bankAccount: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
      recurringType: 'monthly'
    });
    setShowAddRecurring(false);
    setIsEditingRecurring(false);
    setEditingRecurringId('');
  };

  return (
    <>
      <Head>
        <title>Finance Tracker - Accounts</title>
        <meta name="description" content="Manage payment accounts and EMI tracking" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
        {/* Header */}
        <PageHeader 
          title="Financial Accounts" 
          subtitle="Manage your accounts, EMIs & recurring transactions" 
          logo="/image_no_bg.png"
          gradient="blue"
        />

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {!userId ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <p className="text-gray-500 text-lg">Please log in to view your accounts</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading your financial data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Accounts</p>
                      <p className="text-2xl font-bold">{accounts.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <CreditCard size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Active EMIs</p>
                      <p className="text-2xl font-bold">{emis.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <CreditCard size={20} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Recurring Expenses</p>
                      <p className="text-2xl font-bold">{recurringExpenses.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <TrendingDown size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Recurring Income</p>
                      <p className="text-2xl font-bold">{recurringIncome.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Accounts Section */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Payment Accounts</h2>
                      <p className="text-sm text-gray-500">Manage your payment methods</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {accounts.length > 0 ? (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-full ${getAccountColor(account.type)}`}>
                            {getAccountIcon(account.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-600">{account.type}</p>
                            {account.details && (
                              <p className="text-xs text-gray-500 mt-1">{account.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">No payment accounts yet</p>
                    <p className="text-gray-400 text-sm">Add your first payment method</p>
                  </div>
                )}
              </div>

              {/* EMI Tracking Section */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">EMI Tracking</h2>
                      <p className="text-sm text-gray-500">Monitor your loan payments</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddEMI(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {emis.length > 0 ? (
                  <div className="space-y-3">
                    {emis.map((emi) => (
                      <div key={emi._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:border-green-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CreditCard size={16} className="text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-green-900">{emi.name}</h3>
                              <p className="text-sm text-green-700">
                                {calculateRemainingMonths(emi.startDate, emi.monthsRemaining)} months left
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => editEMI(emi)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEMI(emi._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                              Due: {emi.dueDay}th monthly
                            </span>
                          </div>
                          <span className="font-bold text-green-800 text-lg">
                            {formatCurrency(emi.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">No EMI records yet</p>
                    <p className="text-gray-400 text-sm">Add your first EMI to track</p>
                  </div>
                )}

                {/* Upcoming EMIs Alert */}
                {upcomingEMIs.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <CreditCard size={14} className="text-yellow-600" />
                      </div>
                      <h3 className="font-semibold text-yellow-800">Upcoming EMIs</h3>
                    </div>
                    <div className="space-y-2">
                      {upcomingEMIs.map((emi) => (
                        <div key={emi._id} className="flex items-center justify-between bg-white bg-opacity-50 rounded-lg p-2">
                          <span className="text-sm text-yellow-700 font-medium">{emi.name}</span>
                          <span className="text-sm font-semibold text-yellow-800">
                            {formatCurrency(emi.amount)} - Due {emi.dueDay}th
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recurring Transactions Section */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <RefreshCw className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recurring Transactions</h2>
                      <p className="text-sm text-gray-500">Manage automatic payments & income</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddRecurring(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Add
                  </button>
                </div>

                {/* Recurring Expenses */}
                {recurringExpenses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <TrendingDown size={18} className="text-red-500 mr-2" />
                      Recurring Expenses
                    </h3>
                    <div className="space-y-3">
                      {recurringExpenses.map((expense) => (
                        <div key={expense._id} className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 hover:border-red-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <TrendingDown size={16} className="text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-red-900">{expense.category}</h4>
                                <p className="text-sm text-red-700">{expense.paymentMode}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editRecurring(expense)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                <Edit size={14} className="inline mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteRecurring(expense._id, 'expense')}
                                className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} className="inline mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">
                                {expense.recurringType}
                              </span>
                              <span className="text-sm text-red-600">
                                Started: {new Date(expense.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="font-bold text-red-700 text-lg">
                              -{formatCurrency(expense.amount)}
                            </span>
                          </div>
                          {expense.note && (
                            <p className="text-sm text-red-600 mt-3 italic bg-white bg-opacity-50 p-2 rounded-lg">"{expense.note}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recurring Income */}
                {recurringIncome.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <TrendingUp size={18} className="text-green-500 mr-2" />
                      Recurring Income
                    </h3>
                    <div className="space-y-3">
                      {recurringIncome.map((income) => (
                        <div key={income._id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp size={16} className="text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-900">{income.source}</h4>
                                <p className="text-sm text-green-700">Income Source</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editRecurring(income)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                <Edit size={14} className="inline mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteRecurring(income._id, 'income')}
                                className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} className="inline mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                {income.recurringType}
                              </span>
                              <span className="text-sm text-green-600">
                                Started: {new Date(income.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="font-bold text-green-700 text-lg">
                              +{formatCurrency(income.amount)}
                            </span>
                          </div>
                          {income.note && (
                            <p className="text-sm text-green-600 mt-3 italic bg-white bg-opacity-50 p-2 rounded-lg">"{income.note}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Recurring Transactions */}
                {recurringExpenses.length === 0 && recurringIncome.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="text-gray-400" size={28} />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No recurring transactions yet</p>
                    <p className="text-gray-400 text-sm">Add recurring expenses or income to track them automatically</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 z-50 space-y-3">
          <button
            onClick={() => setShowAddAccount(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-4 shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            title="Add Payment Account"
          >
            <CreditCard size={20} />
          </button>
          <button
            onClick={() => setShowAddEMI(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-4 shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            title="Add EMI"
          >
            <CreditCard size={20} />
          </button>
          <button
            onClick={() => setShowAddRecurring(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-4 shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
            title="Add Recurring Transaction"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Add Account Modal */}
        {showAddAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Payment Account</h2>
                <button onClick={resetAccountForm} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    required
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({...accountForm, type: e.target.value as 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., HDFC Credit Card"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details (Optional)</label>
                  <textarea
                    value={accountForm.details}
                    onChange={(e) => setAccountForm({...accountForm, details: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows={3}
                    placeholder="Card number, UPI ID, etc."
                  />
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={resetAccountForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add EMI Modal */}
        {showAddEMI && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{isEditingEMI ? 'Edit' : 'Add'} EMI</h2>
                <button onClick={resetEMIForm} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddEMI} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">EMI Name</label>
                  <input
                    type="text"
                    required
                    value={emiForm.name}
                    onChange={(e) => setEmiForm({...emiForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Home Loan, Car Loan"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.amount}
                    onChange={(e) => setEmiForm({...emiForm, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={emiForm.startDate}
                    onChange={(e) => setEmiForm({...emiForm, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={emiForm.dueDay}
                      onChange={(e) => setEmiForm({...emiForm, dueDay: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Months Remaining</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={emiForm.monthsRemaining}
                      onChange={(e) => setEmiForm({...emiForm, monthsRemaining: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="24"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Account</label>
                  <select
                    required
                    value={emiForm.paymentAccountId}
                    onChange={(e) => setEmiForm({...emiForm, paymentAccountId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={resetEMIForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isEditingEMI ? 'Update' : 'Add'} EMI
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Recurring Transaction Modal */}
        {showAddRecurring && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditingRecurring ? 'Edit' : 'Add'} Recurring {recurringType === 'expense' ? 'Expense' : 'Income'}
                </h2>
                <button onClick={resetRecurringForm} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddRecurring} className="space-y-4">
                {/* Transaction Type Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setRecurringType('expense')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      recurringType === 'expense'
                        ? 'bg-white text-red-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <TrendingDown size={16} className="inline mr-2" />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringType('income')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      recurringType === 'income'
                        ? 'bg-white text-green-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <TrendingUp size={16} className="inline mr-2" />
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={recurringForm.amount}
                      onChange={(e) => setRecurringForm({...recurringForm, amount: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={recurringForm.date}
                      onChange={(e) => setRecurringForm({...recurringForm, date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Category/Source Field */}
                {recurringType === 'expense' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      required
                      value={recurringForm.category}
                      onChange={(e) => setRecurringForm({...recurringForm, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select Category</option>
                      {EXPENSE_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <select
                      required
                      value={recurringForm.source}
                      onChange={(e) => setRecurringForm({...recurringForm, source: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select Source</option>
                      {INCOME_SOURCES.map(source => (
                        <option key={source.value} value={source.value}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment Mode (for expenses) */}
                {recurringType === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      required
                      value={recurringForm.paymentMode}
                      onChange={(e) => setRecurringForm({...recurringForm, paymentMode: e.target.value, bankAccount: ''})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      {PAYMENT_MODES.map(mode => (
                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bank Account (for UPI, Credit Card, Debit Card) */}
                {recurringType === 'expense' && (recurringForm.paymentMode === 'UPI' || recurringForm.paymentMode === 'Credit Card' || recurringForm.paymentMode === 'Debit Card') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {recurringForm.paymentMode === 'UPI' ? 'Select UPI ID / Bank Account' : 'Select Bank Account'}
                    </label>
                    <select
                      required
                      value={recurringForm.bankAccount}
                      onChange={(e) => setRecurringForm({...recurringForm, bankAccount: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select Account</option>
                      {accounts
                        .filter(account => account.type === recurringForm.paymentMode)
                        .map(account => (
                          <option key={account._id} value={account._id}>
                            {account.name} {account.details ? `(${account.details})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Recurring Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Type</label>
                  <select
                    required
                    value={recurringForm.recurringType}
                    onChange={(e) => setRecurringForm({...recurringForm, recurringType: e.target.value as 'monthly' | 'yearly'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  >
                    {RECURRING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                  <textarea
                    value={recurringForm.note}
                    onChange={(e) => setRecurringForm({...recurringForm, note: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    rows={3}
                    placeholder="Add a note about this recurring transaction..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={resetRecurringForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                      recurringType === 'expense'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    }`}
                  >
                    {isEditingRecurring ? 'Update' : 'Add'} Recurring {recurringType === 'expense' ? 'Expense' : 'Income'}
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
            title="Confirm Deletion"
            message={`Are you sure you want to delete ${confirmAction.name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        )}

        <BottomNav />
      </div>
    </>
  );
}
