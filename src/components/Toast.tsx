import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  return { toast, showToast, hideToast };
}