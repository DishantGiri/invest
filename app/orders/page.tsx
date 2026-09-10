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
      <div className="p-4 space-y-4 animate-pulse max-w-5xl mx-auto">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-5xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-black text-cyan-400 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              My Active Orders
            </h2>
            <p className="text-xs text-sky-200/90 font-medium mt-0.5">
              CATL Daily ROI Investment Returns
            </p>
          </div>
          <span className="bg-blue-600/30 border border-blue-500/40 text-cyan-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {summary.activeCount} Active Plans
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Total Invested
            </p>
            <p className="text-lg font-black text-white">
              NPR {summary.totalActiveInvestmentValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Ready to Claim
            </p>
            <p className="text-lg font-black text-cyan-400">
              NPR {summary.totalClaimableAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {summary.totalClaimableAmount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claiming}
            className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Coins className="w-4 h-4 fill-white" />
            <span>{claiming ? 'Collecting Profits...' : `Collect All Profits (NPR ${summary.totalClaimableAmount.toFixed(2)})`}</span>
          </button>
        )}
      </div>

      {/* Orders List */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/90 space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-black text-slate-900 text-sm">No Active Investment Orders</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Choose a CATL battery investment plan from the Home tab to start earning daily returns!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => {
            const progressPercent = Math.min(100, Math.round((inv.days_passed / inv.duration_days) * 100));

            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
                      <Zap className="w-5 h-5 fill-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs">{inv.plan_name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Started: {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      inv.status === 'active'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Daily Income</span>
                    <span className="font-black text-blue-600 mt-0.5">NPR {inv.daily_income.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Earned So Far</span>
                    <span className="font-black text-slate-900 mt-0.5">NPR {inv.total_claimed.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Cycle Days</span>
                    <span className="font-bold text-slate-800 mt-0.5">{inv.days_passed}/{inv.duration_days}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>Investment Cycle Progress</span>
                    <span className="text-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {inv.claimStats.claimableAmount > 0 ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-2xl text-xs">
                    <div className="flex items-center text-blue-950 font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                      ROI Ready: NPR {inv.claimStats.claimableAmount.toFixed(2)}
                    </div>
                    <button
                      onClick={handleClaimAll}
                      disabled={claiming}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[11px] shadow-md shadow-blue-600/20"
                    >
                      Claim
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Cycle ROI Progress
                    </span>
                    <span className="font-semibold text-blue-600">
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
