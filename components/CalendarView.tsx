import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';

interface CalendarViewProps {
  expenses: Array<{ date: Date | string; amount: number; category: string }>;
  income: Array<{ date: Date | string; amount: number; source: string }>;
  onDateClick: (date: Date) => void;
  selectedDate?: Date | null;
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
}

export default function CalendarView({ expenses, income, onDateClick, selectedDate, currentMonth, onMonthChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(currentMonth);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setCurrentDate(currentMonth);
  }, [currentMonth]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => {
      // Handle both Date objects and string dates from API
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
      return isSameDay(expenseDate, date);
    });
  };

  const getIncomeForDate = (date: Date) => {
    return income.filter(inc => {
      // Handle both Date objects and string dates from API
      const incomeDate = inc.date instanceof Date ? inc.date : new Date(inc.date);
      return isSameDay(incomeDate, date);
    });
  };

  const getTotalForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    const dayIncome = getIncomeForDate(date);
    const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = dayIncome.reduce((sum, inc) => sum + inc.amount, 0);
    return totalExpenses - totalIncome; // Net amount (negative for expenses, positive for income)
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return amount.toString();
    }
  };

  // Get the maximum width needed for amount display
  const getMaxAmountWidth = () => {
    const maxAmount = Math.max(...expenses.map(exp => exp.amount), ...income.map(inc => inc.amount), 0);
    const formatted = formatAmount(maxAmount);
    return formatted.length;
  };

  const previousMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newMonth);
    onMonthChange(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newMonth);
    onMonthChange(newMonth);
  };

  // Touch handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    // Clear any previous touch state
    setTouchStart(null);
    setTouchEnd(null);
    // Set new touch start
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Only update touch end if we have a valid touch start
    if (touchStart !== null) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // Reset state if incomplete touch
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextMonth();
    } else if (isRightSwipe) {
      previousMonth();
    }
    
    // Always reset touch state after handling swipe
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Reset touch state when component unmounts or date changes
  useEffect(() => {
    setTouchStart(null);
    setTouchEnd(null);
  }, [currentDate]);

  // Additional cleanup effect
  useEffect(() => {
    return () => {
      setTouchStart(null);
      setTouchEnd(null);
    };
  }, []);

  // Calculate monthly totals for current month
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div 
      ref={calendarRef}
      className="bg-white rounded-[24px] shadow-xl border border-gray-100 p-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header with Month Navigation and Totals */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        <button
          onClick={nextMonth}
          className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers - Fixed duplicate keys */}
        {[
          { key: 'sun', label: 'S' },
          { key: 'mon', label: 'M' },
          { key: 'tue', label: 'T' },
          { key: 'wed', label: 'W' },
          { key: 'thu', label: 'T' },
          { key: 'fri', label: 'F' },
          { key: 'sat', label: 'S' }
        ].map(day => (
          <div key={day.key} className="p-1 text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day.label}
            </div>
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => {
          const dayExpenses = getExpensesForDate(day);
          const dayIncome = getIncomeForDate(day);
          const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const totalIncome = dayIncome.reduce((sum, inc) => sum + inc.amount, 0);
          const hasExpenses = totalExpenses > 0;
          const hasIncome = totalIncome > 0;
          const hasTransactions = hasExpenses || hasIncome;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'relative p-1 min-h-[52px] rounded-xl transition-all duration-200 hover:scale-105',
                'flex flex-col items-center justify-center',
                'border border-transparent overflow-hidden cursor-pointer',
                isToday(day) && 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
                hasExpenses && !isToday(day) && 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:bg-red-100',
                hasIncome && !isToday(day) && 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:bg-green-100',
                hasExpenses && hasIncome && !isToday(day) && 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:bg-yellow-100',
                !hasTransactions && !isToday(day) && 'bg-gray-50 hover:bg-gray-100 border-gray-200',
                // Selected state (not today)
                selectedDate && !isToday(day) && isSameDay(day, selectedDate) && 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50 border-blue-200'
              )}
              title={hasTransactions ? `View transactions for ${format(day, 'MMM d')}` : `No transactions on ${format(day, 'MMM d')}`}
            >
              {/* Day Number */}
              <div className={cn(
                'text-xs font-bold mb-0.5 leading-none',
                isToday(day) ? 'text-white' : hasTransactions ? 'text-gray-800' : 'text-gray-600'
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Amount Display */}
              {hasTransactions && (
                <div className="space-y-1">
                  {hasExpenses && (
                    <div className={cn(
                      'text-[9px] font-bold leading-tight px-1 py-0.5 rounded-full w-full text-center',
                      'max-w-[calc(100%-2px)] overflow-hidden',
                      isToday(day) 
                        ? 'bg-red-500/80 text-white' 
                        : 'bg-red-500 text-white shadow-sm'
                    )}>
                      {formatAmount(totalExpenses)}
                    </div>
                  )}
                  {hasIncome && (
                    <div className={cn(
                      'text-[9px] font-bold leading-tight px-1 py-0.5 rounded-full w-full text-center',
                      'max-w-[calc(100%-2px)] overflow-hidden',
                      isToday(day) 
                        ? 'bg-green-500/80 text-white' 
                        : 'bg-green-500 text-white shadow-sm'
                    )}>
                      {formatAmount(totalIncome)}
                    </div>
                  )}
                </div>
              )}

              {/* Today Indicator */}
              {isToday(day) && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white shadow-sm"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
