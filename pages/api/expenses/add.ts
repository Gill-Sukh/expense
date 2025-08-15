import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { date, amount, category, paymentMode, bankAccount, paymentAccountId, note, emiId, userId, isRecurring, recurringType } = req.body;

    if (!date || !amount || !category || !paymentMode || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const expense = await db.collection('expenses').insertOne({
      userId,
      date: new Date(date),
      amount: parseFloat(amount),
      category,
      paymentMode,
      bankAccount: bankAccount || null,
      paymentAccountId: paymentAccountId || null,
      note: note || '',
      emiId: emiId || null,
      isRecurring: isRecurring || false,
      recurringType: recurringType || null,
      createdAt: new Date()
    });

    res.status(200).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
