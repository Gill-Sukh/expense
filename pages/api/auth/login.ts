import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';
import { generateTokens, comparePassword } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const client = await clientPromise;
    const db = client.db('finance_app');

    // Find user by email
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

    // Remove old refresh tokens for this user
    await db.collection('refresh_tokens').deleteMany({ userId: user._id });

    // Store new refresh token
    await db.collection('refresh_tokens').insertOne({
      userId: user._id,
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Return user data (without password) and tokens
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email
    };

    res.status(200).json({
      message: 'Login successful',
      user: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
