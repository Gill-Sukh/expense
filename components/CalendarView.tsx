import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';

interface CalendarViewProps {
  expenses: Array<{ date: Date | string; amount: number; category: string }>;
  onDateClick: (date: Date) => void;
  selectedDate?: Date | null;
}

export default function CalendarView({ expenses, onDateClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  const getTotalForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
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
    const maxAmount = Math.max(...expenses.map(exp => exp.amount), 0);
    const formatted = formatAmount(maxAmount);
    return formatted.length;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  return (
    <div 
      ref={calendarRef}
      className="bg-white rounded-[24px] shadow-xl border border-gray-100 p-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-[180px]">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track your daily expenses</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={previousMonth}
            className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            aria-label="Next month"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Swipe Hint */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-600 font-medium">
            Swipe left/right to navigate months
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="p-1 text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map(day => {
          const total = getTotalForDate(day);
          const hasExpenses = total > 0;
          
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
                !hasExpenses && !isToday(day) && 'bg-gray-50 hover:bg-gray-100 border-gray-200',
                // Selected state (not today)
                selectedDate && !isToday(day) && isSameDay(day, selectedDate) && 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50 border-blue-200'
              )}
              title={hasExpenses ? `View expenses for ${format(day, 'MMM d')}` : `No expenses on ${format(day, 'MMM d')}`}
            >
              {/* Day Number */}
              <div className={cn(
                'text-xs font-bold mb-0.5 leading-none',
                isToday(day) ? 'text-white' : hasExpenses ? 'text-gray-800' : 'text-gray-600'
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Amount Display */}
              {hasExpenses && (
                <div className={cn(
                  'text-[9px] font-bold leading-tight px-1 py-0.5 rounded-full w-full text-center',
                  'max-w-[calc(100%-2px)] overflow-hidden',
                  isToday(day) 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-500 text-white shadow-sm'
                )}>
                  {formatAmount(total)}
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
