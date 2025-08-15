import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { id } = req.query;
    const { date, amount, category, paymentMode, bankAccount, paymentAccountId, note, emiId, userId, isRecurring, recurringType } = req.body;

    if (!date || !amount || !category || !paymentMode || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert id to ObjectId if valid
    let objectId;
    try {
      objectId = new ObjectId(id as string);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const result = await db.collection('expenses').updateOne(
      { _id: objectId, userId },
      {
        $set: {
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
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
