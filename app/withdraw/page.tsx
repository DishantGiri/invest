'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Building2, User, CreditCard, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface Transaction {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_method: string;
  payment_details: string;
  admin_note?: string;
  created_at: string;
}

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('eSewa');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);

  const fetchProfileAndHistory = useCallback(async () => {
    try {
      const pRes = await fetch('/api/user/profile');
      const pData = await pRes.json();
      if (pData.user) {
        setBalance(pData.user.balance || 0);
        if (pData.user.bank_name) setBankName(pData.user.bank_name);
        if (pData.user.account_name) setAccountName(pData.user.account_name);
        if (pData.user.account_number) setAccountNumber(pData.user.account_number);
      }

      const wRes = await fetch('/api/withdraw');
      const wData = await wRes.json();
      if (wData.withdrawals) {
        setHistory(wData.withdrawals);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProfileAndHistory();
  }, [fetchProfileAndHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawAmt = Number(amount);
    if (isNaN(withdrawAmt) || withdrawAmt < 100) {
      showToast('Minimum withdrawal amount is NPR 100', 'error');
      return;
    }

    if (withdrawAmt > balance) {
      showToast('Insufficient wallet balance!', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmt,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Withdrawal request failed', 'error');
        setLoading(false);
        return;
      }

      showToast(data.message, 'success');
      setAmount('');
      fetchProfileAndHistory();
    } catch {
      showToast('Failed to submit withdrawal request', 'error');
    } font-bold
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Withdraw Funds</h2>
              <p className="text-xs text-cyan-400 font-semibold">
                Fast Payout to Bank / eSewa / Khalti
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Balance</span>
            <span className="text-xl font-black text-cyan-400">NPR {balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Request Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Withdrawal Amount (NPR)
            </label>
            <input
              type="number"
              min="100"
              required
              placeholder="Min NPR 100"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-blue-600 focus:outline-none focus:border-blue-600 focus:bg-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Payment Channel / Bank Name
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            >
              <option value="eSewa">eSewa Wallet</option>
              <option value="Khalti">Khalti Wallet</option>
              <option value="Global IME Bank">Global IME Bank</option>
              <option value="Nabil Bank">Nabil Bank</option>
              <option value="NIC Asia Bank">NIC Asia Bank</option>
              <option value="Prabhu Bank">Prabhu Bank</option>
              <option value="USDT TRC20">USDT TRC20 Crypto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Account Holder Name
            </label>
            <input
              type="text"
              required
              placeholder="Name on bank / wallet account"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Account / Phone Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9841234567 or Bank AC"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Withdrawal History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No withdrawal history found.</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-extrabold text-slate-900">NPR {tx.amount.toFixed(2)} ({tx.payment_method})</p>
                  <p className="text-[10px] text-slate-500 font-medium">{new Date(tx.created_at).toLocaleString()}</p>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    tx.status === 'approved' || tx.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : tx.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
