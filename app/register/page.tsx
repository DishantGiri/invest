'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Phone,
  User,
  Users,
  Gift,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  Sparkles
} from 'lucide-react';
import { showToast } from '@/components/Toast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    phone_or_email: '',
    full_name: '',
    password: '',
    referral_code: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setForm((prev) => ({ ...prev, referral_code: refParam.toUpperCase() }));
    }
  }, [searchParams]);

  // Simple password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' };
    if (pass.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-rose-500' };
    if (pass.length < 9) return { score: 2, label: 'Good Password', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong Security', color: 'bg-cyan-400' };
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Registration failed', 'error');
        setLoading(false);
        return;
      }

      showToast('Account Created! Instant Welcome Bonus NPR 50.00 Credited.', 'success');
      router.push('/');
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
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-center border-b border-slate-800 relative">
            <div className="inline-flex items-center justify-center space-x-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-bold uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instant Welcome Bonus Included</span>
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
              Create CATL Account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Start Earning Daily High Yield Battery Returns
            </p>

            <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-cyan-300 text-xs font-bold shadow-lg">
              <Gift className="w-4 h-4 text-cyan-400" />
              <span>NPR 50.00 Bonus Credited On Sign Up</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9841234567 or email@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={form.phone_or_email}
                  onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Create Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
              {form.password && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Security Rating:</span>
                    <span className="text-cyan-400">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Invitation Code <span className="text-slate-500 font-normal lowercase">(Optional)</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. CATL1234"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={form.referral_code}
                  onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-[11px] text-slate-400">
                By registering, you agree to CATL Platform Terms & Clean Energy Investment SLA.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering & Crediting Bonus...</span>
                </span>
              ) : (
                <>
                  <span>Create Account & Claim NPR 50</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
                  Sign In Here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center space-x-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Protected by CATL Enterprise Security Protocol v4.2</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading registration terminal...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
