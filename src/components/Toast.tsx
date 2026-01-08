'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto min-w-[300px] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300 ${
              toast.type === 'success' ? 'bg-white border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-white border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-white border-yellow-200 text-yellow-800' :
              'bg-white border-blue-200 text-blue-800'
            }`}
          >
            <span className={`text-lg ${
               toast.type === 'success' ? 'text-green-500' :
               toast.type === 'error' ? 'text-red-500' :
               toast.type === 'warning' ? 'text-yellow-500' :
               'text-blue-500'
            }`}>
              {getToastIcon(toast.type)}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button 
              onClick={() => hideToast(toast.id)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function getToastIcon(type: Toast['type']) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
  }
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
