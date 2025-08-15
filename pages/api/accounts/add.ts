import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { type, name, details, userId } = req.body;

    if (!type || !name || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const account = await db.collection('payment_accounts').insertOne({
      userId,
      type,
      name,
      details: details || '',
      createdAt: new Date()
    });

    res.status(200).json(account);
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
