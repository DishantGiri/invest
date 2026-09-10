'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/components/Toast';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ phone_or_email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setErrorMessage(err);
      showToast(err, 'error');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Admin authentication failed', 'error');
        setLoading(false);
        return;
      }

      if (data.user?.role !== 'admin') {
        showToast('Access denied. This account does not have Admin privileges.', 'error');
        setLoading(false);
        return;
      }

      showToast('Welcome to CATL System Control Center!', 'success');
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      showToast('Network error. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-8 max-w-md mx-auto text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-200/90">
        <div className="bg-slate-900 p-6 text-center text-white">
          <div className="relative w-48 h-16 mx-auto mb-2">
            <Image
              src="/catl_logo_transparent.png"
              alt="CATL Official Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-lg font-black text-cyan-400 tracking-tight">
            CATL SYSTEM ADMIN PORTAL
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Restricted System Administration & Control Center
          </p>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin@catl.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all"
                value={form.phone_or_email}
                onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <span className="font-extrabold text-slate-900">Initial System Admin Credentials:</span><br />
            Email: <code className="text-blue-600 font-bold">admin@catl.com</code> | Password: <code className="text-blue-600 font-bold">admin123</code> (Can be changed in Admin Dashboard Settings)
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            <span>{loading ? 'Entering Admin System...' : 'Access Admin Control'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 text-center">
            <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900">
              ← Return to Regular User Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading admin login portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
