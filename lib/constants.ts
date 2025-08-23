// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: 'Food', label: 'Food', icon: '🍕', color: '#ef4444' },
  { value: 'Transport', label: 'Transport', icon: '🚗', color: '#3b82f6' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
  { value: 'Bills', label: 'Bills', icon: '📄', color: '#f59e0b' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { value: 'Health', label: 'Health', icon: '🏥', color: '#10b981' },
  { value: 'Recharge', label: 'Recharge', icon: '📱', color: '#06b6d4' },
  { value: 'Room Rent', label: 'Room Rent', icon: '🏠', color: '#84cc16' },
  { value: 'Groceries', label: 'Groceries', icon: '🛒', color: '#f97316' },
  { value: 'Fuel', label: 'Fuel', icon: '⛽', color: '#dc2626' },
  { value: 'Education', label: 'Education', icon: '📚', color: '#7c3aed' },
  { value: 'Insurance', label: 'Insurance', icon: '🛡️', color: '#059669' },
  { value: 'Taxes', label: 'Taxes', icon: '💰', color: '#b91c1c' },
  { value: 'Gifts', label: 'Gifts', icon: '🎁', color: '#db2777' },
  { value: 'Travel', label: 'Travel', icon: '✈️', color: '#0891b2' },
  { value: 'Utilities', label: 'Utilities', icon: '⚡', color: '#65a30d' },
  { value: 'Other', label: 'Other', icon: '📊', color: '#6b7280' }
];

// Income Sources
export const INCOME_SOURCES = [
  { value: 'Salary', label: 'Salary', icon: '💼', color: '#10b981' },
  { value: 'Freelance', label: 'Freelance', icon: '💻', color: '#3b82f6' },
  { value: 'Investment', label: 'Investment', icon: '📈', color: '#f59e0b' },
  { value: 'Business', label: 'Business', icon: '🏢', color: '#8b5cf6' },
  { value: 'Bonus', label: 'Bonus', icon: '🎯', color: '#ec4899' },
  { value: 'Rental Income', label: 'Rental Income', icon: '🏠', color: '#06b6d4' },
  { value: 'Interest', label: 'Interest', icon: '💰', color: '#84cc16' },
  { value: 'Commission', label: 'Commission', icon: '📊', color: '#f97316' },
  { value: 'Other', label: 'Other', icon: '💰', color: '#6b7280' }
];

// Payment Modes
export const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash', icon: '💵' },
  { value: 'UPI', label: 'UPI', icon: '📱' },
  { value: 'Credit Card', label: 'Credit Card', icon: '💳' },
  { value: 'Debit Card', label: 'Debit Card', icon: '💳' }
];

// Recurring Types
export const RECURRING_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

// Chart Colors
export const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#10b981', '#6366f1', '#a855f7',
  '#dc2626', '#059669', '#7c3aed', '#db2777'
];

// Get category by value
export const getCategoryByValue = (value: string) => {
  return EXPENSE_CATEGORIES.find(cat => cat.value === value) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
};

// Get income source by value
export const getIncomeSourceByValue = (value: string) => {
  return INCOME_SOURCES.find(source => source.value === value) || INCOME_SOURCES[INCOME_SOURCES.length - 1];
};

// Get payment mode by value
export const getPaymentModeByValue = (value: string) => {
  return PAYMENT_MODES.find(mode => mode.value === value) || PAYMENT_MODES[0];
};
