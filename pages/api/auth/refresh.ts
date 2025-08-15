import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';
import { generateTokens, verifyToken, REFRESH_SECRET } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const client = await clientPromise;
    const db = client.db('finance_app');

    // Verify refresh token
    const payload = verifyToken(refreshToken, REFRESH_SECRET);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database
    const storedToken = await db.collection('refresh_tokens').findOne({
      userId: new ObjectId(payload.userId),
      token: refreshToken,
      expiresAt: { $gt: new Date() }
    });

    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user data
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.email
    );

    // Remove old refresh token
    await db.collection('refresh_tokens').deleteOne({ _id: storedToken._id });

    // Store new refresh token
    await db.collection('refresh_tokens').insertOne({
      userId: user._id,
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
