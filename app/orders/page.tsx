'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Zap, Clock, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface UserInvestment {
  id: number;
  plan_name: string;
  invest_price: number;
  daily_income: number;
  total_expected: number;
  total_claimed: number;
  duration_days: number;
  days_passed: number;
  status: 'active' | 'completed';
  created_at: string;
  claimStats: {
    claimableDays: number;
    claimableAmount: number;
    nextClaimInSeconds: number;
    hoursPassedInCycle: string;
  };
}

export default function OrdersPage() {
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [summary, setSummary] = useState({ totalActiveInvestmentValue: 0, totalClaimableAmount: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchInvestments = useCallback(async () => {
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      if (data.investments) {
        setInvestments(data.investments);
        setSummary(data.summary);
      }
    } catch {
      showToast('Failed to load active orders', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleClaimAll = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/plans/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'No profits ready to claim right now', 'error');
      } else {
        showToast(data.message, 'success');
        fetchInvestments();
      }
    } catch {
      showToast('Failed to claim profits', 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-28 bg-emerald-900/20 rounded-2xl" />
        <div className="h-32 bg-white rounded-2xl" />
        <div className="h-32 bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-black text-emerald-400 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              My Active Orders
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              CATL Daily ROI Investment Returns
            </p>
          </div>
          <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {summary.activeCount} Active Plans
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-800/60">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Total Invested
            </p>
            <p className="text-lg font-black text-white">
              NPR {summary.totalActiveInvestmentValue.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Ready to Claim
            </p>
            <p className="text-lg font-black text-emerald-400">
              NPR {summary.totalClaimableAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {summary.totalClaimableAmount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claiming}
            className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Coins className="w-4 h-4 fill-emerald-950" />
            <span>{claiming ? 'Collecting Profits...' : `Collect All Profits (NPR ${summary.totalClaimableAmount.toFixed(2)})`}</span>
          </button>
        )}
      </div>

      {/* Orders List */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-700 text-sm">No Investment Orders Yet</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Choose a CATL investment plan from the Home tab to start earning daily returns!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {investments.map((inv) => {
            const progressPercent = Math.min(100, Math.round((inv.days_passed / inv.duration_days) * 100));

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      <Zap className="w-4 h-4 fill-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{inv.plan_name}</h4>
                      <p className="text-[10px] text-slate-400">
                        Started: {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      inv.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Daily Income</span>
                    <span className="font-bold text-emerald-600">NPR {inv.daily_income.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Earned So Far</span>
                    <span className="font-bold text-slate-800">NPR {inv.total_claimed.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase block">Cycle Days</span>
                    <span className="font-bold text-slate-800">{inv.days_passed}/{inv.duration_days}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Investment Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {inv.claimStats.claimableAmount > 0 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs">
                    <div className="flex items-center text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                      ROI Ready: NPR {inv.claimStats.claimableAmount.toFixed(2)}
                    </div>
                    <button
                      onClick={handleClaimAll}
                      disabled={claiming}
                      className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-500"
                    >
                      Claim
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Cycle ROI progress
                    </span>
                    <span className="font-medium text-emerald-700">
                      {inv.claimStats.hoursPassedInCycle}h / 24h passed
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
