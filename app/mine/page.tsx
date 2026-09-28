'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Wallet,
  ArrowUpRight,
  Star,
  Users,
  CreditCard,
  History,
  ShieldCheck,
  LogOut,
  HelpCircle,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { showToast } from '@/components/Toast';

interface UserData {
  id: number;
  phone_or_email: string;
  full_name: string;
  role: string;
  referral_code: string;
  balance: number;
  total_income: number;
  total_recharge: number;
  total_withdrawal: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  activeInvestmentsCount: number;
  teamCount: number;
}

export default function MinePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: '', account_name: '', account_number: '' });
  const [savingBank, setSavingBank] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setBankForm({
          bank_name: data.user.bank_name || 'eSewa',
          account_name: data.user.account_name || '',
          account_number: data.user.account_number || ''
        });
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('Logged out successfully', 'success');
      router.push('/login');
      router.refresh();
    } catch {
      showToast('Failed to logout', 'error');
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update bank details', 'error');
        setSavingBank(false);
        return;
      }

      showToast('Bank details updated successfully!', 'success');
      setShowBankModal(false);
      fetchProfile();
    } catch {
      showToast('Network error while saving bank', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-5xl mx-auto text-slate-900">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex items-center space-x-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">{user?.full_name || 'CATL Investor'}</h2>
              <span className="text-[10px] font-extrabold bg-blue-600/30 text-cyan-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                VIP 1
              </span>
            </div>
            <p className="text-xs text-sky-300 font-semibold">{user?.phone_or_email}</p>
            <p className="text-[11px] text-cyan-400 font-mono mt-0.5">Invite Code: {user?.referral_code}</p>
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Wallet Balance</span>
            <span className="text-lg font-black text-white">NPR {user?.balance ? user.balance.toFixed(2) : '0.00'}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Revenue</span>
            <span className="text-lg font-black text-cyan-400">NPR {user?.total_income ? user.total_income.toFixed(2) : '0.00'}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Recharged</span>
            <span className="text-base font-bold text-white">NPR {user?.total_recharge ? user.total_recharge.toFixed(2) : '0.00'}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Total Withdrawn</span>
            <span className="text-base font-bold text-white">NPR {user?.total_withdrawal ? user.total_withdrawal.toFixed(2) : '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Account Control Links */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
        <button
          onClick={() => setShowBankModal(true)}
          className="w-full p-4.5 flex justify-between items-center hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Bank / Wallet Setup</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.bank_name ? `${user.bank_name} - ${user.account_number}` : 'Configure withdrawal account'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <Link
          href="/orders"
          className="w-full p-4.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">My Active Investments</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.activeInvestmentsCount || 0} active plans yielding daily income
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/team"
          className="w-full p-4.5 flex justify-between items-center hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Invite & Team Management</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {user?.teamCount || 0} team members registered under your link
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/admin/dashboard"
            className="w-full p-4.5 flex justify-between items-center bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-cyan-400">System Admin Control Center</h4>
                <p className="text-[11px] text-slate-400">Review pending deposits, payouts, & user balances</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </Link>
        )}

        <a
          href="https://wa.me/message/UBPVDRWPZGS7H1?src=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4.5 flex justify-between items-center hover:bg-emerald-50/60 transition-colors"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center p-2 shadow-md shadow-emerald-500/20 shrink-0">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center">
                <span>Official Customer Support</span>
                <span className="ml-2 bg-emerald-100 text-emerald-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded">24/7 WhatsApp</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">Contact official CATL WhatsApp helpdesk</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500" />
        </a>

        <button
          onClick={handleLogout}
          className="w-full p-4.5 flex justify-between items-center hover:bg-rose-50 transition-colors text-rose-600"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black">Log Out Account</h4>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      {/* Bank Account Edit Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-base">Withdrawal Bank Setup</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bank / Wallet Provider</label>
                <input
                  type="text"
                  required
                  placeholder="eSewa / Khalti / Global IME Bank"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name as in Bank/Wallet"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Account / Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="Account Number or Wallet ID"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={savingBank}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {savingBank ? 'Saving...' : 'Save Bank Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
