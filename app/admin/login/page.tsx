'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import { showToast } from '@/components/Toast';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ phone_or_email: 'admin@catl.com', password: 'admin123' });
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
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-8">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="bg-slate-850 p-6 text-center border-b border-slate-800">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mx-auto mb-3 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-emerald-400 tracking-tight">
            CATL ADMIN PORTAL
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted System Administration & Control Center
          </p>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Admin Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin@catl.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 text-white"
                value={form.phone_or_email}
                onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 text-white"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-emerald-400">Default Admin Credentials:</span><br />
            Email: <code className="text-white">admin@catl.com</code> | Password: <code className="text-white">admin123</code>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span>{loading ? 'Entering Admin System...' : 'Access Admin Control'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 text-center">
            <Link href="/login" className="text-xs text-slate-400 hover:text-white">
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
