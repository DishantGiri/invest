'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Star,
  ShoppingCart,
  ArrowUpRight,
  Users,
  Gift,
  Zap,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Cpu,
  Activity,
  Award
} from 'lucide-react';
import { showToast } from '@/components/Toast';

interface InvestmentPlan {
  id: number;
  name: string;
  price: number;
  daily_income: number;
  total_revenue: number;
  duration_days: number;
  vip_level: number;
  badge_text: string;
}

interface UserProfile {
  id: number;
  full_name: string;
  phone_or_email: string;
  balance: number;
  total_income: number;
  role: string;
  referral_code: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investing, setInvesting] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [claimingGift, setClaimingGift] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // ignore
    }
  }, [router]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchPlans();
  }, [fetchUserData, fetchPlans]);

  const handleInvest = async () => {
    if (!selectedPlan) return;
    setInvesting(true);

    try {
      const res = await fetch('/api/plans/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlan.id })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Investment failed', 'error');
        setInvesting(false);
        return;
      }

      showToast(data.message, 'success');
      setSelectedPlan(null);
      fetchUserData();
    } catch {
      showToast('Network error during investment', 'error');
    } finally {
      setInvesting(false);
    }
  };

  const handleClaimGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode) return;
    setClaimingGift(true);

    try {
      const res = await fetch('/api/gift-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftCode })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Invalid code', 'error');
        setClaimingGift(false);
        return;
      }

      showToast(data.message, 'success');
      setGiftCode('');
      setShowGiftModal(false);
      fetchUserData();
    } catch {
      showToast('Failed to claim gift code', 'error');
    } finally {
      setClaimingGift(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-4 md:px-0 text-slate-900">
      {/* Top Banner & Wallet Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 pt-6 pb-12 px-5 md:px-8 rounded-b-[2rem] md:rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* User Info / Branding */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 p-1.5 flex items-center justify-center shadow-md">
                <Image
                  src="/catl_logo_transparent.png"
                  alt="CATL Tech Logo"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-white">
                    {user?.full_name || 'CATL Investor'}
                  </h2>
                  <span className="bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    VIP 1 Member
                  </span>
                </div>
                <p className="text-xs text-sky-300 font-semibold">
                  {user?.phone_or_email}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 hidden md:block max-w-md leading-relaxed">
              Welcome to Contemporary Amperex Technology Co. Limited (CATL). Invest in clean energy battery storage matrix and earn guaranteed daily interest payouts.
            </p>
          </div>

          {/* Wallet Balance Box */}
          <div className="md:col-span-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-3">
            <p className="text-[11px] font-extrabold tracking-widest text-cyan-400 uppercase">
              AVAILABLE WALLET BALANCE
            </p>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
              NPR {user?.balance !== undefined ? user.balance.toFixed(2) : '0.00'}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-1">
              <Link
                href="/recharge"
                className="py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Recharge</span>
              </Link>

              <Link
                href="/withdraw"
                className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-600/30 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Withdraw</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="-mt-8 md:mt-0 relative z-20 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-3 md:p-4 border border-slate-200/90 grid grid-cols-4 gap-2 text-center">
          <Link
            href="/recharge"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
              <Star className="w-6 h-6 fill-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Recharge</span>
          </Link>

          <Link
            href="/withdraw"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Withdraw</span>
          </Link>

          <Link
            href="/team"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Invite</span>
          </Link>

          <button
            onClick={() => setShowGiftModal(true)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Gift Code</span>
          </button>
        </div>
      </div>

      {/* Investment Plans Section */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
            <Zap className="w-5 h-5 text-blue-600 mr-2 fill-blue-600" />
            CATL Battery Investment Plans
          </h3>
          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Daily Auto Income
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Plan Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Cpu className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {plan.name}
                      </h4>
                      <p className="text-base font-black text-blue-600">
                        NPR {plan.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                    {plan.badge_text || `VIP ${plan.vip_level}`}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="bg-slate-50/80 p-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Income</p>
                    <p className="font-black text-blue-600 mt-0.5">NPR {plan.daily_income.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
                    <p className="font-black text-slate-900 mt-0.5">NPR {plan.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cycle</p>
                    <p className="font-bold text-slate-800 mt-0.5">{plan.duration_days} Days</p>
                  </div>
                </div>
              </div>

              {/* Invest Button */}
              <div className="p-4 bg-white border-t border-slate-100">
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Invest Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Zap className="w-4 h-4 fill-blue-600" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Confirm Investment</h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Plan Name:</span>
                <span className="font-black text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Investment Price:</span>
                <span className="font-black text-blue-600">NPR {selectedPlan.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Daily Auto Return:</span>
                <span className="font-bold text-blue-700">NPR {selectedPlan.daily_income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Duration:</span>
                <span className="font-bold text-slate-800">{selectedPlan.duration_days} Days</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={investing}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
              >
                {investing ? 'Processing...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Code Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Redeem Gift Code</h3>
              </div>
              <button
                onClick={() => setShowGiftModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimGift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter Gift Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CATL2026"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                />
              </div>

              <button
                type="submit"
                disabled={claimingGift}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <span>{claimingGift ? 'Redeeming...' : 'Claim Gift Bonus'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
