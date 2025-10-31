'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { toastsAtom, ToastData } from '../store/atoms';
import { removeToast } from '../utils/toastHelpers';

interface ToastProps {
  toast: ToastData;
}

const Toast = ({ toast }: ToastProps) => {
  const [, setToasts] = useAtom(toastsAtom);

  useEffect(() => {
    const timer = setTimeout(() => {
      setToasts((toasts) => removeToast(toasts, toast.id));
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, setToasts]);

  const handleClose = () => {
    setToasts((toasts) => removeToast(toasts, toast.id));
  };

  const typeStyles = {
    info: 'bg-blue-500 border-blue-600',
    success: 'bg-green-500 border-green-600',
    warning: 'bg-yellow-500 border-yellow-600',
    error: 'bg-red-500 border-red-600',
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div
      className={`
        ${typeStyles[toast.type]}
        text-white px-4 py-3 rounded-lg shadow-lg border-2
        flex items-center gap-3 min-w-64 max-w-sm
        animate-slide-in-up
      `}
    >
      <span className="text-xl">{typeIcons[toast.type]}</span>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={handleClose}
        className="text-white hover:text-gray-200 transition-colors text-lg font-bold"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
