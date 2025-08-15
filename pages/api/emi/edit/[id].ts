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
    const { name, amount, startDate, dueDay, monthsRemaining, paymentAccountId, userId } = req.body;

    if (!name || !amount || !startDate || !dueDay || !monthsRemaining || !paymentAccountId || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Try to convert to ObjectId if it's a valid MongoDB ObjectId
    let query: any = { _id: id, userId };
    
    try {
      if (ObjectId.isValid(id as string)) {
        query = { _id: new ObjectId(id as string), userId };
      }
    } catch (error) {
      console.log('ID is not a valid ObjectId, using as string');
    }

    console.log('Attempting to update EMI with query:', query);

    const result = await db.collection('emi').updateOne(
      query,
      {
        $set: {
          name,
          amount: parseFloat(amount),
          startDate: new Date(startDate),
          dueDay: parseInt(dueDay),
          monthsRemaining: parseInt(monthsRemaining),
          paymentAccountId,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('EMI not found with query:', query);
      return res.status(404).json({ message: 'EMI not found' });
    }

    console.log('EMI updated successfully');
    res.status(200).json({ message: 'EMI updated successfully' });
  } catch (error) {
    console.error('Error updating EMI:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
