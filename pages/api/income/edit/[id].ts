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
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    const { amount, source, note, date, isRecurring, recurringType } = req.body;

    // Validate required fields
    if (!amount || !source || !date) {
      return res.status(400).json({ message: 'Amount, source, and date are required' });
    }

    // Convert id to ObjectId if valid
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if income record exists
    const existingIncome = await db.collection('income').findOne({ _id: objectId });
    
    if (!existingIncome) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Update the income record
    const result = await db.collection('income').updateOne(
      { _id: objectId },
      {
        $set: {
          amount: parseFloat(amount),
          source,
          note: note || '',
          date: new Date(date),
          isRecurring: isRecurring || false,
          recurringType: recurringType || 'monthly',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.status(200).json({ message: 'Income updated successfully' });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
