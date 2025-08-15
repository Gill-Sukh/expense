import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { date, amount, source, note, userId, isRecurring, recurringType } = req.body;

    if (!date || !amount || !source || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const income = await db.collection('income').insertOne({
      userId,
      date: new Date(date),
      amount: parseFloat(amount),
      source,
      note: note || '',
      isRecurring: isRecurring || false,
      recurringType: recurringType || null,
      createdAt: new Date()
    });

    res.status(200).json(income);
  } catch (error) {
    console.error('Error adding income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
