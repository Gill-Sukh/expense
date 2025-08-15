import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';

interface CalendarViewProps {
  expenses: Array<{ date: Date; amount: number; category: string }>;
  onDateClick: (date: Date) => void;
  onAddExpense: () => void;
}

export default function CalendarView({ expenses, onDateClick, onAddExpense }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => isSameDay(expense.date, date));
  };

  const getTotalForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={onAddExpense}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const total = getTotalForDate(day);
          const hasExpenses = total > 0;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'p-2 min-h-[60px] text-left border border-gray-100 hover:bg-gray-50 transition-colors',
                isToday(day) && 'bg-primary-50 border-primary-200',
                hasExpenses && 'bg-red-50 border-red-200'
              )}
            >
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'd')}
              </div>
              {hasExpenses && (
                <div className="text-xs text-red-600 font-medium mt-1">
                  {formatCurrency(total)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
