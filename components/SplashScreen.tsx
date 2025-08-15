import React from 'react';
import { TrendingUp, DollarSign, Shield, Zap } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-30">
              <div className="relative">
                <TrendingUp size={48} className="text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <DollarSign size={16} className="text-white" />
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Shield size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center animate-bounce">
              <Zap size={16} className="text-white" />
            </div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold mb-2 tracking-tight">
          FinanceFlow
        </h1>
        
        {/* Tagline */}
        <p className="text-xl text-white text-opacity-90 mb-8 font-light">
          Smart Money Management
        </p>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={24} className="text-white" />
            </div>
            <p className="text-sm text-white text-opacity-80">Track Expenses</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <DollarSign size={24} className="text-white" />
            </div>
            <p className="text-sm text-white text-opacity-80">Smart Budgeting</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield size={24} className="text-white" />
            </div>
            <p className="text-sm text-white text-opacity-80">Secure Data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
