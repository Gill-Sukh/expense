import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from './SplashScreen';
import LoginScreen from './LoginScreen';
import Dashboard from './Dashboard';

const AppWrapper: React.FC = () => {
  const { user, isLoading } = useAuth();

  console.log('🔄 AppWrapper render:', { user, isLoading });

  if (isLoading) {
    console.log('⏳ Showing SplashScreen (loading)');
    return <SplashScreen />;
  }

  if (!user) {
    console.log('🔐 Showing LoginScreen (no user)');
    return <LoginScreen />;
  }

  console.log('✅ Showing Dashboard (user authenticated)');
  return <Dashboard />;
};

export default AppWrapper;
