import { useState } from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Expense, Income, PaymentAccount } from '../lib/types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Expense | Income | null;
  accounts: PaymentAccount[];
  onEdit: (transaction: Expense | Income) => void;
  onDelete: (transactionId: string) => void;
}

export default function TransactionModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  onEdit,
  onDelete
}: TransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const isExpense = 'category' in transaction;
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc._id === accountId);
    return account ? account.name : '';
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'UPI':
        return '📱';
      case 'Credit Card':
        return '💳';
      case 'Debit Card':
        return '💳';
      case 'Cash':
        return '💵';
      default:
        return '💰';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return '🍕';
      case 'Transport':
        return '🚗';
      case 'Shopping':
        return '🛍️';
      case 'Bills':
        return '📄';
      case 'Entertainment':
        return '🎬';
      case 'Health':
        return '🏥';
      case 'Recharge':
        return '📱';
      case 'Room Rent':
        return '🏠';
      case 'Groceries':
        return '🛒';
      case 'Fuel':
        return '⛽';
      case 'Education':
        return '📚';
      case 'Insurance':
        return '🛡️';
      case 'Taxes':
        return '💰';
      case 'Gifts':
        return '🎁';
      case 'Travel':
        return '✈️';
      case 'Utilities':
        return '⚡';
      default:
        return '📊';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Salary':
        return '💼';
      case 'Freelance':
        return '💻';
      case 'Investment':
        return '📈';
      case 'Business':
        return '🏢';
      case 'Bonus':
        return '🎯';
      case 'Rental Income':
        return '🏠';
      case 'Interest':
        return '💰';
      case 'Commission':
        return '📊';
      default:
        return '💰';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Transaction Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Amount Section */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            {/* Category/Source */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl">
                {isExpense 
                  ? getCategoryIcon(transaction.category)
                  : getSourceIcon(transaction.source)
                }
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {isExpense ? 'Category' : 'Source'}
                </p>
                <p className="font-semibold text-gray-900">
                  {isExpense ? transaction.category : transaction.source}
                </p>
              </div>
            </div>

            {/* Payment Mode (for expenses) */}
            {isExpense && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl">
                  {getPaymentModeIcon(transaction.paymentMode)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Mode</p>
                  <p className="font-semibold text-gray-900">
                    {transaction.paymentMode}
                  </p>
                </div>
              </div>
            )}

            {/* Bank Account (if applicable) */}
            {isExpense && transaction.bankAccount && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl">🏦</div>
                <div>
                  <p className="text-sm text-gray-500">Account</p>
                  <p className="font-semibold text-gray-900">
                    {getAccountName(transaction.bankAccount)}
                  </p>
                </div>
              </div>
            )}

            {/* Recurring Status */}
            {transaction.isRecurring && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl">🔄</div>
                <div>
                  <p className="text-sm text-blue-600">Recurring</p>
                  <p className="font-semibold text-blue-800 capitalize">
                    {transaction.recurringType}
                  </p>
                </div>
              </div>
            )}

            {/* Note */}
            {transaction.note && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Note</p>
                <p className="text-gray-900">{transaction.note}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => onEdit(transaction)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit size={18} />
              Edit
            </button>
            <button
              onClick={() => onDelete(transaction._id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
