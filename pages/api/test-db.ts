import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing MongoDB connection...');
    
    const client = await clientPromise;
    const db = client.db('finance_app');
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray();
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    res.status(200).json({ 
      message: 'MongoDB connection successful!',
      collections: collections.map(c => c.name),
      database: 'finance_app'
    });
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    res.status(500).json({ 
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
