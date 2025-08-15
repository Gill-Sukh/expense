import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, ChevronLeft, ChevronRight, X, Minus } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import CalendarView from '../components/CalendarView';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { Expense } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    paymentMode: 'Cash',
    bankAccount: '',
    note: '',
    isRecurring: false,
    recurringType: 'monthly' as 'monthly' | 'yearly'
  });

  const { user } = useAuth();
  const userId = user?._id || '';

  useEffect(() => {
    if (userId) {
      fetchExpenses();
    }
  }, [currentMonth, userId]);

  const fetchExpenses = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Fetch all expenses for the user (not just current month)
      const response = await fetch(`/api/expenses/list?userId=${userId}`);
      const allExpenses = await response.json();
      
      // Fetch EMIs for the user
      const emiResponse = await fetch(`/api/emi/list?userId=${userId}`);
      const allEMIs = await emiResponse.json();
      
      // Filter expenses for current month and add recurring ones
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      const currentMonthExpenses = allExpenses.filter((expense: Expense) => {
        const expDate = new Date(expense.date);
        return expDate >= startDate && expDate <= endDate;
      });
      
      // Add recurring expenses for the current month
      const recurringExpenses = allExpenses.filter((expense: Expense) => {
        if (!expense.isRecurring) return false;
        
        const expDate = new Date(expense.date);
        const expMonth = expDate.getMonth();
        const expYear = expDate.getFullYear();
        const currentMonthNum = currentMonth.getMonth();
        const currentYearNum = currentMonth.getFullYear();
        
        // Monthly recurring expenses (add to all months)
        if (expense.recurringType === 'monthly') {
          return true;
        }
        
        // Yearly recurring expenses (add if in current year)
        if (expense.recurringType === 'yearly' && expYear === currentYearNum) {
          return true;
        }
        
        return false;
      });
      
      // Convert EMIs to expenses for the current month
      const currentMonthEMIs = allEMIs.filter((emi: any) => {
        // Check if EMI is due in current month
        const emiStartDate = new Date(emi.startDate);
        const emiMonth = emiStartDate.getMonth();
        const emiYear = emiStartDate.getFullYear();
        const currentMonthNum = currentMonth.getMonth();
        const currentYearNum = currentMonth.getFullYear();
        
        // EMI should show in current month if:
        // 1. It started before or in current month AND
        // 2. It still has months remaining AND
        // 3. It's in the same year or started in a previous year
        return (emiMonth <= currentMonthNum && emiYear <= currentYearNum) && emi.monthsRemaining > 0;
      }).map((emi: any) => ({
        _id: `emi_${emi._id}`,
        userId: emi.userId,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), emi.dueDay),
        amount: emi.amount,
        category: `EMI - ${emi.name}`,
        paymentMode: 'Credit Card' as any, // Default payment mode for EMIs
        bankAccount: '',
        note: `EMI payment due on ${emi.dueDay}th`,
        emiId: emi._id,
        isRecurring: true,
        recurringType: 'monthly' as 'monthly',
        createdAt: new Date()
      }));
      
      // Combine one-time expenses, recurring expenses, and EMIs
      const combinedExpenses = [...currentMonthExpenses, ...recurringExpenses, ...currentMonthEMIs];
      setExpenses(combinedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAddModal(true);
  };

  const handleAddExpense = () => {
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please log in to add expenses');
      return;
    }
    
    try {
      const payload = {
        userId,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMode: formData.paymentMode,
        bankAccount: formData.bankAccount || null,
        note: formData.note,
        date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring ? formData.recurringType : null
      };

      const response = await fetch('/api/expenses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
                 setFormData({ amount: '', category: '', paymentMode: 'Cash', bankAccount: '', note: '', isRecurring: false, recurringType: 'monthly' });
        fetchExpenses(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/delete/${expenseId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchExpenses(); // Refresh data
        } else {
          console.error('Failed to delete expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ amount: '', category: '', paymentMode: 'Cash', bankAccount: '', note: '', isRecurring: false, recurringType: 'monthly' });
    setShowAddModal(false);
  };

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => 
      format(new Date(expense.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getTotalForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <>
      <Head>
        <title>Finance Tracker - Calendar</title>
        <meta name="description" content="Monthly expense calendar view" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">Monthly expense tracking</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          {!userId ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Please log in to view your calendar</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading expenses...</p>
            </div>
          ) : (
            <>
              <CalendarView
                expenses={expenses}
                onDateClick={handleDateClick}
                onAddExpense={handleAddExpense}
              />

              {/* Monthly Summary */}
              <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {format(currentMonth, 'MMMM yyyy')} Summary
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days with Expenses</p>
                    <p className="text-xl font-bold text-gray-900">
                      {new Set(expenses.map(exp => format(new Date(exp.date), 'yyyy-MM-dd'))).size}
                    </p>
                  </div>
                </div>
                
                {/* Recurring Expenses Summary */}
                {expenses.some(exp => exp.isRecurring) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Recurring Expenses</h3>
                    <div className="space-y-2">
                      {expenses
                        .filter(exp => exp.isRecurring)
                        .map((expense) => (
                          <div key={expense._id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">🔄</span>
                              <span className="text-gray-600">{expense.category}</span>
                              <span className="text-xs text-gray-500">({expense.recurringType})</span>
                            </div>
                            <span className="font-medium text-red-600">
                              -{formatCurrency(expense.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Date Details */}
              {selectedDate && (
                 <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
                   <h2 className="text-lg font-semibold text-gray-900 mb-4">
                     {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                   </h2>
                   {getExpensesForDate(selectedDate).length > 0 ? (
                     <div className="space-y-3">
                       {getExpensesForDate(selectedDate).map((expense) => (
                         <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <p className="font-medium text-gray-900">{expense.category}</p>
                               <div className="flex items-center gap-2">
                                 {expense.isRecurring && (
                                   <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                     🔄 {expense.recurringType}
                                   </span>
                                 )}
                                 <button
                                   onClick={() => deleteExpense(expense._id)}
                                   className="text-red-600 hover:text-red-800 text-xs font-medium"
                                 >
                                   Delete
                                 </button>
                               </div>
                             </div>
                             <p className="text-sm text-gray-600">{expense.paymentMode}</p>
                             {expense.bankAccount && (
                               <p className="text-xs text-gray-500">{expense.bankAccount}</p>
                             )}
                             {expense.note && (
                               <p className="text-xs text-gray-500 mt-1">{expense.note}</p>
                             )}
                           </div>
                           <div className="text-right">
                             <p className="font-semibold text-red-600">
                               -{formatCurrency(expense.amount)}
                             </p>
                           </div>
                         </div>
                       ))}
                       <div className="pt-3 border-t">
                         <div className="flex justify-between items-center">
                           <span className="font-semibold text-gray-900">Total</span>
                           <span className="font-bold text-red-600">
                             -{formatCurrency(getTotalForDate(selectedDate))}
                           </span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-500 text-center py-4">No expenses on this date</p>
                   )}
                 </div>
               )}
             </>
           )}
         </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={handleAddExpense}
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 transform hover:scale-105"
            title="Add Expense"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Add Expense
                  {selectedDate && (
                    <span className="block text-sm font-normal text-gray-600">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  )}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>
                
                {/* Bank Account Details for UPI, Credit Card, Debit Card */}
                {(formData.paymentMode === 'UPI' || formData.paymentMode === 'Credit Card' || formData.paymentMode === 'Debit Card') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.paymentMode === 'UPI' ? 'UPI ID / Bank Account' : 'Bank Account Details'}
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={
                        formData.paymentMode === 'UPI' 
                          ? 'Enter UPI ID (e.g., name@bank)' 
                          : 'Enter bank name and last 4 digits'
                      }
                    />
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
                      Recurring Expense
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
                    Add Expense
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
