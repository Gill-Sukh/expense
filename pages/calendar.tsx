import { useState, useEffect } from 'react';
import Head from 'next/head';
import BottomNav from '../components/BottomNav';
import CalendarView from '../components/CalendarView';
import PageHeader from '../components/PageHeader';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { Expense, Income } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const userId = user?._id || '';

  useEffect(() => {
    if (userId) {
      console.log('Calendar useEffect triggered, currentMonth:', currentMonth);
      fetchData();
    }
  }, [currentMonth, userId]);

  const fetchData = async () => {
    if (!userId) return;
    
    console.log('Fetching data for month:', currentMonth);
    setIsLoading(true);
    try {
      // Fetch all expenses for the user
      const expensesRes = await fetch(`/api/expenses/list?userId=${userId}`);
      const allExpenses = await expensesRes.json();
      
      // Fetch all income for the user
      const incomeRes = await fetch(`/api/income/list?userId=${userId}`);
      const allIncome = await incomeRes.json();
      
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
        paymentMode: 'Credit Card' as any,
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
      
      // Filter income for current month and add recurring ones
      const currentMonthIncome = allIncome.filter((inc: Income) => {
        const incDate = new Date(inc.date);
        return incDate >= startDate && incDate <= endDate;
      });
      
      // Add recurring income for the current month
      const recurringIncome = allIncome.filter((inc: Income) => {
        if (!inc.isRecurring) return false;
        
        const incDate = inc.date instanceof Date ? inc.date : new Date(inc.date);
        const incMonth = incDate.getMonth();
        const incYear = incDate.getFullYear();
        const currentMonthNum = currentMonth.getMonth();
        const currentYearNum = currentMonth.getFullYear();
        
        // Monthly recurring income (add to all months)
        if (inc.recurringType === 'monthly') {
          return true;
        }
        
        // Yearly recurring income (add if in current year)
        if (inc.recurringType === 'yearly' && incYear === currentYearNum) {
          return true;
        }
        
        return false;
      });
      
      const combinedIncome = [...currentMonthIncome, ...recurringIncome];
      setIncome(combinedIncome);
      
      console.log('Data fetched successfully for month:', currentMonth);
      console.log('Expenses count:', combinedExpenses.length);
      console.log('Income count:', combinedIncome.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (newMonth: Date) => {
    console.log('Month change requested to:', newMonth);
    setCurrentMonth(newMonth);
    setSelectedDate(null); // Reset selected date when month changes
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
        <PageHeader 
          title={`${format(currentMonth, 'MMMM yyyy')}`}
          subtitle="Monthly Calendar View"
          logo="/image_no_bg.png"
          gradient="blue"
        />

        <div className="max-w-md mx-auto px-6 py-8 -mt-6">
          {!userId ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-[24px] p-8 shadow-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-gray-500 text-lg">Please log in to view your calendar</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-[24px] p-8 shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading your calendar...</p>
              </div>
            </div>
          ) : (
            <>
              <CalendarView
                expenses={expenses}
                income={income.map(inc => ({
                  date: inc.date,
                  amount: inc.amount,
                  source: inc.source
                }))}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
              />

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  💡 <strong>Tip:</strong> Click on any day to view expenses for that date.
                </p>
              </div>

              <div className="mt-8 bg-white rounded-[24px] p-6 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-indigo-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-800 text-lg">📊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Monthly EMI Overview
                    </h2>
                    <p className="text-gray-500">EMI Overview</p>
                  </div>
                </div>
                
                {expenses.some(exp => exp.isRecurring) && (
                  <div className="pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      {expenses
                        .filter(exp => exp.isRecurring)
                        .map((expense) => (
                          <div key={expense._id} className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-3">
                              <span className="text-amber-500">📅</span>
                              <div>
                                <span className="text-gray-800 font-medium">{expense.category}</span>
                                <span className="text-xs text-gray-700 ml-2 bg-white px-2 py-1 rounded-full">
                                  {expense.recurringType}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 text-lg">
                              -{formatCurrency(expense.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedDate && (
                 <div className="mt-8 bg-white rounded-[24px] p-6 shadow-xl border border-gray-100">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                       <span className="text-white text-lg">📅</span>
                     </div>
                     <div>
                       <h2 className="text-xl font-bold text-gray-900">
                         {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                       </h2>
                       <p className="text-gray-500">Daily expense details</p>
                     </div>
                   </div>
                   
                   {getExpensesForDate(selectedDate).length > 0 ? (
                     <div className="space-y-4">
                       {getExpensesForDate(selectedDate).map((expense) => (
                         <div key={expense._id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                 <span className="text-blue-600 text-sm">💰</span>
                               </div>
                               <div>
                                 <p className="font-semibold text-gray-900">{expense.category}</p>
                                 <p className="text-sm text-gray-600">{expense.paymentMode}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-red-600 text-lg">
                                 -{formatCurrency(expense.amount)}
                               </p>
                               {expense.isRecurring && (
                                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                   🔄 {expense.recurringType}
                                 </span>
                               )}
                             </div>
                           </div>
                           
                           {(expense.bankAccount || expense.note) && (
                             <div className="pt-3 border-t border-gray-200 space-y-2">
                               {expense.bankAccount && (
                                 <p className="text-xs text-gray-500 flex items-center gap-1">
                                   <span>🏦</span> {expense.bankAccount}
                                 </p>
                               )}
                               {expense.note && (
                                 <p className="text-xs text-gray-500 flex items-center gap-1">
                                   <span>📝</span> {expense.note}
                                 </p>
                               )}
                             </div>
                           )}
                         </div>
                       ))}
                       
                       <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-2xl border border-red-200">
                         <div className="flex justify-between items-center">
                           <span className="font-semibold text-red-800 text-lg">Total for this day</span>
                           <span className="font-bold text-red-700 text-xl">
                             -{formatCurrency(getTotalForDate(selectedDate))}
                           </span>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-8">
                       <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                         <span className="text-2xl">✨</span>
                       </div>
                       <p className="text-gray-500 text-lg">No expenses on this date</p>
                       <p className="text-gray-400 text-sm">Great job staying on budget!</p>
                     </div>
                   )}
                 </div>
               )}
            </>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
