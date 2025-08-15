export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Expense {
  _id: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  paymentMode: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card';
  bankAccount?: string;
  paymentAccountId?: string;
  note?: string;
  emiId?: string;
  isRecurring?: boolean;
  recurringType?: 'monthly' | 'yearly';
  createdAt: Date;
}

export interface Income {
  _id: string;
  userId: string;
  date: Date;
  amount: number;
  source: string;
  note?: string;
  isRecurring?: boolean;
  recurringType?: 'monthly' | 'yearly';
  createdAt: Date;
}

export interface PaymentAccount {
  _id: string;
  userId: string;
  type: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card';
  name: string;
  details?: string;
  createdAt: Date;
}

export interface EMI {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  startDate: Date;
  dueDay: number;
  monthsRemaining: number;
  paymentAccountId: string;
  createdAt: Date;
}

export interface Category {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
  icon?: string;
}

export interface Settings {
  _id: string;
  userId: string;
  key: string;
  value: string;
}

export interface DashboardStats {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlyNet: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}
