'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone_or_email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
        showToast(data.error || 'Login failed', 'error');
        setLoading(false);
        return;
      }

      showToast('Welcome back to CATL Energy!', 'success');

      if (data.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      showToast('Network error. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Banner header */}
        <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Zap className="w-8 h-8 text-emerald-950 fill-emerald-950" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-emerald-400">
            CATL MEMBER LOGIN
          </h2>
          <p className="text-xs text-emerald-200/80 mt-1 font-medium">
            Contemporary Amperex Technology Co. Limited
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter registered Phone or Email"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                value={form.phone_or_email}
                onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Login Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In To Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-bold text-emerald-600 hover:underline">
                Create Account
              </Link>
            </p>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center text-[11px] font-semibold text-slate-500 hover:text-emerald-700"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Admin Portal Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
