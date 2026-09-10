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
  CheckCircle2,
  Zap,
  Activity,
  Award
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
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Dynamic Background Mesh & Glowing Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Main Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-blue-950/50 overflow-hidden">
          {/* Header Banner with Official CATL Logo */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-center border-b border-slate-800 relative">
            <div className="inline-flex items-center justify-center space-x-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-bold tracking-wide uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Official Clean Energy Terminal
            </div>

            <div className="relative w-52 h-16 mx-auto mb-2">
              <Image
                src="/catl_logo_transparent.png"
                alt="CATL Contemporary Amperex Technology Co., Limited Logo"
                fill
                className="object-contain filter drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                priority
              />
            </div>

            <h1 className="text-xl font-black text-white tracking-tight">
              Member Authentication
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Contemporary Amperex Technology Investment Platform
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Method Tabs: Phone / Email */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'phone'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Login</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'email'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Login</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {loginMethod === 'phone' ? 'Mobile Phone Number' : 'Email Address'}
                </label>
                <div className="relative">
                  {loginMethod === 'phone' ? (
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type={loginMethod === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={
                      loginMethod === 'phone'
                        ? 'e.g. 9841234567'
                        : 'e.g. investor@catl.com'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={form.phone_or_email}
                    onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 text-sm"
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

              <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  New to CATL Platform?{' '}
                  <Link href="/register" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
                    Create Account & Get NPR 50 Bonus
                  </Link>
                </p>
                <div>
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center text-[11px] font-semibold text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Authorized Admin Portal
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Live System Trust Signals */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-300">256-Bit SSL</p>
            <p className="text-[9px] text-slate-500">Bank Encrypted</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
            <Activity className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-300">Instant Daily</p>
            <p className="text-[9px] text-slate-500">Auto Payouts</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
            <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-slate-300">ISO Certified</p>
            <p className="text-[9px] text-slate-500">CATL Official</p>
          </div>
        </div>
      </div>
    </div>
  );
}
