import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { JWTPayload } from '../lib/auth';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const checkAuthStatus = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) {
      console.log('⏳ Auth check already in progress, skipping...');
      return;
    }

    setIsCheckingAuth(true);
    try {
      console.log('🔍 Checking auth status...');
      const accessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !storedRefreshToken) {
        console.log('❌ No tokens found, stopping loading');
        setIsLoading(false);
        return;
      }

      console.log('🔑 Tokens found, verifying access token...');
      // Verify access token
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Token verified, setting user:', userData.user);
        setUser(userData.user);
      } else {
        console.log('⚠️ Token verification failed, trying refresh...');
        // Try to refresh token
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          console.log('❌ Token refresh failed, logging out');
          // If refresh fails, clear tokens and stop loading
          logout();
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // On error, clear tokens and stop loading
      logout();
    } finally {
      console.log('🏁 Auth check complete, setting loading to false');
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: userData, accessToken, refreshToken } = await response.json();
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        setUser(userData);
        setIsLoading(false); // Stop loading immediately after successful login
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Starting registration...');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const { user: userData, accessToken, refreshToken } = await response.json();
        console.log('✅ Registration successful, setting tokens and user...');
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        setUser(userData);
        setIsLoading(false); // Stop loading immediately after successful registration
        console.log('👤 User state updated:', userData);
        return true;
      } else {
        console.log('❌ Registration failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
