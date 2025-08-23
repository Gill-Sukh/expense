import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, X, CreditCard, Building2, Wallet } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import { formatCurrency } from '../lib/utils';
import { PaymentAccount, EMI } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export default function Accounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddEMI, setShowAddEMI] = useState(false);
  const [isEditingEMI, setIsEditingEMI] = useState(false);
  const [editingEMIId, setEditingEMIId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete-emi'; id: string; name: string } | null>(null);
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
      const [accountsRes, emisRes] = await Promise.all([
        fetch(`/api/accounts/list?userId=${userId}`),
        fetch(`/api/emi/list?userId=${userId}`)
      ]);

      const accountsData = await accountsRes.json();
      const emisData = await emisRes.json();

      setAccounts(accountsData);
      setEmis(emisData);
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
      const response = await fetch(`/api/emi/delete/${confirmAction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowConfirmModal(false);
        setConfirmAction(null);
        fetchData(); // Refresh data
      } else {
        console.error('Failed to delete EMI');
      }
    } catch (error) {
      console.error('Error deleting EMI:', error);
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

  return (
    <>
      <Head>
        <title>Finance Tracker - Accounts</title>
        <meta name="description" content="Manage payment accounts and EMI tracking" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <PageHeader 
          title="Accounts" 
          subtitle="Payment accounts & EMI tracking" 
          logo="/image_no_bg.png"
          gradient="blue"
        />

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {!userId ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Please log in to view your accounts</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading accounts...</p>
            </div>
          ) : (
            <>
              {/* Payment Accounts */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Accounts</h2>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {accounts.length > 0 ? (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={account._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getAccountColor(account.type)}`}>
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-600">{account.type}</p>
                            {account.details && (
                              <p className="text-xs text-gray-500">{account.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No payment accounts yet</p>
                )}
              </div>

              {/* EMI Tracking */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">EMI Tracking</h2>
                  <button
                    onClick={() => setShowAddEMI(true)}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {emis.length > 0 ? (
                  <div className="space-y-3">
                    {emis.map((emi) => (
                      <div key={emi._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{emi.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {calculateRemainingMonths(emi.startDate, emi.monthsRemaining)} months left
                            </span>
                            <button
                              onClick={() => editEMI(emi)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEMI(emi._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Due: {emi.dueDay}th of every month
                            </span>
                          </div>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(emi.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No EMI records yet</p>
                )}
              </div>

              {/* Upcoming EMIs Alert */}
              {upcomingEMIs.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard size={20} className="text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Upcoming EMIs</h3>
                  </div>
                  <div className="space-y-2">
                    {upcomingEMIs.map((emi) => (
                      <div key={emi._id} className="flex items-center justify-between">
                        <span className="text-sm text-yellow-700">{emi.name}</span>
                        <span className="text-sm font-medium text-yellow-800">
                          {formatCurrency(emi.amount)} - Due {emi.dueDay}th
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                  <CreditCard className="text-blue-500 mx-auto mb-2" size={24} />
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-xl font-bold text-gray-900">{accounts.length}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                  <CreditCard className="text-red-500 mx-auto mb-2" size={24} />
                  <p className="text-sm text-gray-600">Active EMIs</p>
                  <p className="text-xl font-bold text-gray-900">{emis.length}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 z-50 space-y-2">
          <button
            onClick={() => setShowAddAccount(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-105"
            title="Add Account"
          >
            <CreditCard size={20} />
          </button>
          <button
            onClick={() => setShowAddEMI(true)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-105"
            title="Add EMI"
          >
            <CreditCard size={20} />
          </button>
        </div>

        {/* Add Account Modal */}
        {showAddAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Payment Account</h2>
                <button onClick={resetAccountForm} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    required
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({...accountForm, type: e.target.value as 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., HDFC Credit Card"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
                  <textarea
                    value={accountForm.details}
                    onChange={(e) => setAccountForm({...accountForm, details: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Card number, UPI ID, etc."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetAccountForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
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
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{isEditingEMI ? 'Edit' : 'Add'} EMI</h2>
                <button onClick={resetEMIForm} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddEMI} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EMI Name</label>
                  <input
                    type="text"
                    required
                    value={emiForm.name}
                    onChange={(e) => setEmiForm({...emiForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Home Loan, Car Loan"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emiForm.amount}
                    onChange={(e) => setEmiForm({...emiForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={emiForm.startDate}
                    onChange={(e) => setEmiForm({...emiForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={emiForm.dueDay}
                      onChange={(e) => setEmiForm({...emiForm, dueDay: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Months Remaining</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={emiForm.monthsRemaining}
                      onChange={(e) => setEmiForm({...emiForm, monthsRemaining: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="24"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Account</label>
                  <select
                    required
                    value={emiForm.paymentAccountId}
                    onChange={(e) => setEmiForm({...emiForm, paymentAccountId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetEMIForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    {isEditingEMI ? 'Update' : 'Add'} EMI
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
