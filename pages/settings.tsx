import { useState } from 'react';
import Head from 'next/head';
import { Settings, User, Bell, Shield, Download, Globe, Palette, HelpCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('INR');

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { name: 'Profile', description: 'Update your personal information' },
        { name: 'Security', description: 'Password and authentication' },
        { name: 'Privacy', description: 'Data and privacy settings' }
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        { name: 'Currency', description: `Current: ${currency}` },
        { name: 'Theme', description: darkMode ? 'Dark Mode' : 'Light Mode' },
        { name: 'Notifications', description: notifications ? 'Enabled' : 'Disabled' }
      ]
    },
    {
      title: 'Data & Backup',
      icon: Download,
      items: [
        { name: 'Export Data', description: 'Download your financial data' },
        { name: 'Backup', description: 'Cloud backup settings' },
        { name: 'Sync', description: 'Cross-device synchronization' }
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        { name: 'Help Center', description: 'Get help and support' },
        { name: 'Contact Us', description: 'Reach out to our team' },
        { name: 'About', description: 'App version and information' }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>Finance Tracker - Settings</title>
        <meta name="description" content="App settings and preferences" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your preferences</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Quick Settings */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Settings</h2>
            
            <div className="space-y-4">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell size={20} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-600">Get alerts for bills and reminders</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Palette size={20} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-600">Switch to dark theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Currency</p>
                    <p className="text-sm text-gray-600">Select your preferred currency</p>
                  </div>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          {settingsSections.map((section) => (
            <div key={section.title} className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <section.icon size={20} className="text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <button
                    key={item.name}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* App Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Finance Tracker</h3>
            <p className="text-sm text-gray-600 mb-2">Version 1.0.0</p>
            <p className="text-xs text-gray-500">© 2024 Finance Tracker. All rights reserved.</p>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
