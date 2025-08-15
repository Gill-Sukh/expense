import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { name, amount, startDate, dueDay, monthsRemaining, paymentAccountId, userId } = req.body;

    if (!name || !amount || !startDate || !dueDay || !monthsRemaining || !paymentAccountId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const emi = await db.collection('emi').insertOne({
      userId,
      name,
      amount: parseFloat(amount),
      startDate: new Date(startDate),
      dueDay: parseInt(dueDay),
      monthsRemaining: parseInt(monthsRemaining),
      paymentAccountId,
      createdAt: new Date()
    });

    res.status(200).json(emi);
  } catch (error) {
    console.error('Error adding EMI:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
