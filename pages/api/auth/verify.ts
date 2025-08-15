import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';
import { verifyToken, extractTokenFromHeader } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const client = await clientPromise;
    const db = client.db('finance_app');

    // Get user data
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Return user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email
    };

    res.status(200).json({
      message: 'Token is valid',
      user: userData
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
