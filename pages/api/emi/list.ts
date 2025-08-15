import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const emis = await db.collection('emi')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(emis);
  } catch (error) {
    console.error('Error fetching EMIs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
