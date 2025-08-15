import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { userId, startDate, endDate, source } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let filter: any = { userId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (source) {
      filter.source = source;
    }

    const income = await db.collection('income')
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    res.status(200).json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
