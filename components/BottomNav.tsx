import { useRouter } from 'next/router';
import { Home, Calendar, BarChart3, CreditCard, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full transition-colors',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
