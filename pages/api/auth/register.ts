import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/db';
import { generateTokens, hashPassword } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const client = await clientPromise;
    const db = client.db('finance_app');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.insertedId.toString(), email);

    // Store refresh token
    await db.collection('refresh_tokens').insertOne({
      userId: result.insertedId,
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Return user data (without password) and tokens
    const user = {
      _id: result.insertedId,
      name,
      email: email.toLowerCase()
    };

    res.status(201).json({
      message: 'User created successfully',
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
