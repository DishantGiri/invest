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
  Cpu
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
      router.push('/orders');
    } catch {
      showToast('Investment transaction failed', 'error');
    } finally {
      setInvesting(false);
    }
  };

  const handleClaimGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;
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
        <div className="h-48 bg-slate-900/20 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-white rounded-2xl" />
          <div className="h-44 bg-white rounded-2xl" />
          <div className="h-44 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-4 md:px-0">
      {/* Top Banner & Wallet Hero matching PC + Mobile Responsive Design */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 pt-6 pb-12 px-5 md:px-8 rounded-b-[2rem] md:rounded-3xl text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* User Info / Branding */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 p-1 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Image
                  src="/catl_logo.png"
                  alt="CATL Tech Logo"
                  width={56}
                  height={56}
                  className="object-cover rounded-xl w-full h-full"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-white">
                    {user?.full_name || 'CATL Investor'}
                  </h2>
                  <span className="bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    VIP 1
                  </span>
                </div>
                <p className="text-xs text-sky-300 font-medium">
                  {user?.phone_or_email}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 hidden md:block max-w-md">
              Welcome to Contemporary Amperex Technology Co. Limited (CATL). Invest in clean energy battery storage matrix and earn guaranteed daily interest payouts.
            </p>
          </div>

          {/* Wallet Balance Box */}
          <div className="md:col-span-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center shadow-inner space-y-3">
            <p className="text-xs font-bold tracking-widest text-sky-300 uppercase">
              WALLET BALANCE
            </p>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
              NPR {user?.balance !== undefined ? user.balance.toFixed(2) : '0.00'}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-1">
              <Link
                href="/recharge"
                className="py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Recharge</span>
              </Link>

              <Link
                href="/withdraw"
                className="py-3 px-4 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-600/30 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Withdraw</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Action Quick Grid Bar */}
      <div className="-mt-8 md:mt-0 relative z-20 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-4 border border-slate-200 grid grid-cols-4 gap-2 text-center">
          <Link
            href="/recharge"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
              <Star className="w-6 h-6 fill-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Recharge</span>
          </Link>

          <Link
            href="/withdraw"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Withdraw</span>
          </Link>

          <Link
            href="/team"
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Invite</span>
          </Link>

          <button
            onClick={() => setShowGiftModal(true)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">Gift Code</span>
          </button>
        </div>
      </div>

      {/* Investment Plans Section with PC Multi-column Grid */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
            <Zap className="w-5 h-5 text-blue-600 mr-2 fill-blue-600" />
            CATL Battery Investment Plans
          </h3>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Daily Auto Income
          </span>
        </div>

        {/* Responsive Grid: 1 column on mobile, 2 columns on tablet, 3 columns on PC desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Plan Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
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

                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {plan.badge_text || `VIP ${plan.vip_level}`}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="bg-slate-50/80 p-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Income</p>
                    <p className="font-extrabold text-blue-600 mt-0.5">NPR {plan.daily_income.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
                    <p className="font-extrabold text-slate-800 mt-0.5">NPR {plan.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cycle</p>
                    <p className="font-extrabold text-slate-800 mt-0.5">{plan.duration_days} Days</p>
                  </div>
                </div>
              </div>

              {/* Invest Button */}
              <div className="p-4 bg-white border-t border-slate-100">
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/20 transition-all"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Name:</span>
                <span className="font-bold text-slate-800">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Investment Amount:</span>
                <span className="font-bold text-blue-600">NPR {selectedPlan.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Return:</span>
                <span className="font-bold text-blue-600">NPR {selectedPlan.daily_income.toFixed(2)} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Expected Profit:</span>
                <span className="font-bold text-slate-800">NPR {selectedPlan.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cycle Duration:</span>
                <span className="font-bold text-slate-800">{selectedPlan.duration_days} Days</span>
              </div>
              <hr className="border-slate-200 my-2" />
              <div className="flex justify-between font-bold text-sm">
                <span className="text-slate-700">Your Current Balance:</span>
                <span className={(user?.balance || 0) >= selectedPlan.price ? 'text-blue-600' : 'text-rose-600'}>
                  NPR {user?.balance !== undefined ? user.balance.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {(user?.balance || 0) < selectedPlan.price && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                Insufficient balance! Please recharge your account first.
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              {(user?.balance || 0) >= selectedPlan.price ? (
                <button
                  onClick={handleInvest}
                  disabled={investing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1"
                >
                  <span>{investing ? 'Processing...' : 'Confirm & Invest'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/recharge"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center shadow-lg shadow-orange-600/30"
                >
                  Recharge Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gift Code Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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

            <form onSubmit={handleClaimGift} className="space-y-3">
              <p className="text-xs text-slate-600">
                Enter your promo gift code below (Try: <code className="font-bold text-blue-600">CATL2026</code>)
              </p>

              <input
                type="text"
                required
                placeholder="Enter Gift Code (e.g. CATL2026)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-blue-500"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              />

              <button
                type="submit"
                disabled={claimingGift}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1"
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
