import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-super-secret-refresh-key';

export const generateTokens = (userId: string, email: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: string = JWT_SECRET): JWTPayload | null => {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
