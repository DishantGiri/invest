'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [form, setForm] = useState({ phone_or_email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
        showToast(data.error || 'Invalid credentials', 'error');
        setLoading(false);
        return;
      }

      showToast('Welcome back to CATL Energy Platform!', 'success');

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
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden bg-slate-50 text-slate-900">
      {/* Background Soft Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-slate-100/40 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 p-6 text-center text-white relative">
            <div className="inline-flex items-center justify-center space-x-2 px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-cyan-300 text-[10px] font-extrabold tracking-wide uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Official Clean Energy Terminal
            </div>

            <div className="relative w-52 h-16 mx-auto mb-2">
              <Image
                src="/catl_logo_transparent.png"
                alt="CATL Contemporary Amperex Technology Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <h1 className="text-xl font-black text-white tracking-tight">
              Member Authentication
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Contemporary Amperex Technology Investment Platform
            </p>
          </div>

          <div className="p-6 space-y-5 bg-white">
            {/* Method Tabs: Phone / Email */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'phone'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Login</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'email'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Login</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {loginMethod === 'phone' ? 'Mobile Phone Number' : 'Email Address'}
                </label>
                <div className="relative">
                  {loginMethod === 'phone' ? (
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type={loginMethod === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={
                      loginMethod === 'phone'
                        ? 'e.g. 9841234567'
                        : 'e.g. investor@catl.com'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all"
                    value={form.phone_or_email}
                    onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  New to CATL Platform?{' '}
                  <Link href="/register" className="font-extrabold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                    Create Account (Get NPR 50 Bonus)
                  </Link>
                </p>

                <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-medium pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>256-Bit SSL End-to-End Encryption Secured</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center space-x-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Protected by CATL Enterprise Security Protocol v4.2</span>
          </p>
        </div>
      </div>
    </div>
  );
}
