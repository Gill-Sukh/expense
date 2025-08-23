import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import Image from 'next/image';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  logo?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
  onLogout?: () => void;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  logo,
  gradient = 'blue',
  className = '',
  onLogout
}: PageHeaderProps) {
  const getGradientClasses = () => {
    switch (gradient) {
      case 'green':
        return 'from-green-200 to-emerald-300';
      case 'purple':
        return 'from-purple-200 to-indigo-300';
      case 'orange':
        return 'from-orange-200 to-red-300';
      case 'red':
        return 'from-red-200 to-pink-300';
      case 'blue':
      default:
        return 'from-blue-200 to-indigo-300';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getGradientClasses()} text-gray-800 shadow-xl ${className}`}>
      <div className="max-w-md mx-auto px-6 py-5">
        <div className="flex items-center gap-3">
          {/* Logo or Icon */}
          {logo ? (
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 flex items-center justify-center">
                <Image
                  src={logo}
                  alt="Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 flex items-center justify-center">
                <Image
                  src="/image_no_bg.png"
                  alt="Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1 leading-tight text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-700 text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-9 h-9 bg-gray-800/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-gray-800/30 hover:bg-gray-800/30 transition-all duration-200"
              title="Logout"
            >
              <LogOut size={16} className="text-gray-800" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
