'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  const msg: ToastMessage = { id: Math.random().toString(), type, text };
  toastListeners.forEach(fn => fn(msg));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleAdd = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };

    toastListeners.push(handleAdd);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handleAdd);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs space-y-2 px-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center p-3 rounded-xl shadow-xl text-xs font-semibold border transition-all animate-bounce-short ${
            t.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-500'
              : 'bg-rose-900 text-rose-100 border-rose-500'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{t.text}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
