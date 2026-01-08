'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';

// SidebarLink removed to reduce file size, using direct JSX instead if it's cleaner or keep it if reused
// Keeping SidebarLink as it is clean logic
interface SidebarLinkProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, icon, label, isActive, onClick }: SidebarLinkProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-indigo-50 text-indigo-600' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="text-xl w-6 text-center flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

import { useAuth } from '@/hooks/useAuth';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/drops', icon: '🎁', label: 'Drops' },
    { href: '/items', icon: '⚔️', label: 'Items' },
    { href: '/members', icon: '👥', label: 'Members' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm flex-shrink-0">
              🎮
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">LordNine</span>
          </div>
          {/* Close Button (Mobile Only) */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={pathname === link.href || pathname.startsWith(link.href + '/')}
            />
          ))}
        </nav>
        
        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {!authLoading && user && (
            <div className="flex items-center gap-3 px-2 mb-3">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm flex-shrink-0">
                  {user.username?.charAt(0).toUpperCase() || '?'}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-gray-900 truncate" title={user.username}>
                   {user.username}
                 </p>
                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                   user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                 }`}>
                   {user.role}
                 </span>
               </div>
            </div>
          )}
          
          <div className="mb-2">
            <SidebarLink 
              href="/profile" 
              icon="⚙️" 
              label="Settings" 
              isActive={pathname === '/profile'} 
            />
          </div>
          
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group"
          >
            <span className="text-lg w-6 text-center flex-shrink-0 group-hover:scale-110 transition-transform">🚪</span>
            <span>{isLoggingOut ? 'Leaving...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className={`lg:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200 sticky top-0 z-30`}>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-gray-900">
            {navLinks.find(link => pathname.startsWith(link.href))?.label || 'LordNine Stock'}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
