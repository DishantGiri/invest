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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-5 text-white shadow-xl border border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-orange-400">Withdraw Funds</h2>
              <p className="text-xs text-slate-300">
                Fast Payout to Bank / eSewa / Khalti
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-sky-300 font-semibold uppercase block">Available Balance</span>
            <span className="text-lg font-black text-cyan-400">NPR {balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Request Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Withdrawal Amount (NPR)
            </label>
            <input
              type="number"
              min="100"
              required
              placeholder="Min NPR 100"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-600 focus:outline-none focus:border-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Channel / Bank Name
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            >
              <option value="eSewa">eSewa Wallet</option>
              <option value="Khalti">Khalti Wallet</option>
              <option value="Global IME Bank">Global IME Bank</option>
              <option value="Nabil Bank">Nabil Bank</option>
              <option value="NIC Asia Bank">NIC Asia Bank</option>
              <option value="USDT TRC20">USDT TRC20 Crypto</option>
              <option value="Other Bank">Other Commercial Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Account Holder Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Full Name as registered in Bank/eSewa"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Account Number / Phone Number
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Bank Account No. / Mobile Wallet No."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <span>{loading ? 'Submitting Payout...' : 'Submit Withdrawal Request'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Withdrawal Request History */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Withdrawal Request History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">No previous withdrawal requests.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900">NPR {item.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      {item.payment_method}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.payment_details}</p>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center ${
                    item.status === 'approved'
                      ? 'bg-blue-50 text-blue-700'
                      : item.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {item.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {item.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
