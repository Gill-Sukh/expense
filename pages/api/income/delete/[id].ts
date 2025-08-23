import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    // Convert id to ObjectId if valid
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Find the income record first to check if it exists
    const income = await db.collection('income').findOne({ _id: objectId });
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Delete the income record
    const result = await db.collection('income').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.status(200).json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
