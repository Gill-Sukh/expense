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

    // Log the ID for debugging
    console.log('Attempting to delete expense with ID:', id);

    // Try to convert to ObjectId if it's a valid MongoDB ObjectId
    let query: any = { _id: id };
    
    try {
      if (ObjectId.isValid(id as string)) {
        query = { _id: new ObjectId(id as string) };
      }
    } catch (error) {
      console.log('ID is not a valid ObjectId, using as string');
    }

    // First check if the expense exists
    const expense = await db.collection('expenses').findOne(query);
    if (!expense) {
      console.log('Expense not found with query:', query);
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('Found expense:', expense);

    const result = await db.collection('expenses').deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('Expense deleted successfully');
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
