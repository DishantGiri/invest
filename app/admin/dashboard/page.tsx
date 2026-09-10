'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShieldCheck,
  Users,
  Star,
  ShoppingCart,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  DollarSign,
  RefreshCw,
  Sliders,
  QrCode,
  Percent,
  Save,
  Upload,
  ImageIcon,
  Key,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { showToast } from '@/components/Toast';

interface AdminStats {
  totalUsers: number;
  totalUserBalance: number;
  totalInvestmentsCount: number;
  totalInvestedAmount: number;
  pendingRechargesCount: number;
  pendingRechargesAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'recharges' | 'withdrawals' | 'users' | 'plans' | 'settings'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingQrKey, setUploadingQrKey] = useState<string | null>(null);

  // Admin Credentials state
  const [adminCreds, setAdminCreds] = useState({
    phone_or_email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [updatingCreds, setUpdatingCreds] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // User edit modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newBalance, setNewBalance] = useState('');

  // Plan edit/add modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    price: '',
    daily_income: '',
    duration_days: '150',
    vip_level: '1',
    badge_text: 'VIP 1'
  });

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const sRes = await fetch('/api/admin/stats');
      if (sRes.status === 403 || sRes.status === 401) {
        showToast('Admin authorization required', 'error');
        router.push('/admin/login');
        return;
      }
      const sData = await sRes.json();
      if (sData.stats) setStats(sData.stats);

      const rRes = await fetch('/api/admin/recharges');
      const rData = await rRes.json();
      if (rData.recharges) setRecharges(rData.recharges);

      const wRes = await fetch('/api/admin/withdrawals');
      const wData = await wRes.json();
      if (wData.withdrawals) setWithdrawals(wData.withdrawals);

      const uRes = await fetch('/api/admin/users');
      const uData = await uRes.json();
      if (uData.users) setUsers(uData.users);

      const pRes = await fetch('/api/admin/plans');
      const pData = await pRes.json();
      if (pData.plans) setPlans(pData.plans);

      const setRes = await fetch('/api/admin/settings');
      const setData = await setRes.json();
      if (setData.settings) setSettings(setData.settings);

      const profRes = await fetch('/api/user/profile');
      const profData = await profRes.json();
      if (profData.user) {
        setAdminCreds((prev) => ({
          ...prev,
          phone_or_email: profData.user.phone_or_email || ''
        }));
      }
    } catch {
      showToast('Failed to load admin dataset', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminCreds.current_password) {
      showToast('Please enter your current password to authorize changes.', 'error');
      return;
    }

    if (adminCreds.new_password && adminCreds.new_password !== adminCreds.confirm_password) {
      showToast('New password and confirm password do not match!', 'error');
      return;
    }

    if (adminCreds.new_password && adminCreds.new_password.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setUpdatingCreds(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_or_email: adminCreds.phone_or_email,
          current_password: adminCreds.current_password,
          new_password: adminCreds.new_password
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update credentials', 'error');
        return;
      }

      showToast(data.message || 'Admin ID/Password updated successfully!', 'success');
      setAdminCreds((prev) => ({
        ...prev,
        phone_or_email: data.user?.phone_or_email || prev.phone_or_email,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch {
      showToast('Network error while updating credentials', 'error');
    } finally {
      setUpdatingCreds(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleFileUpload = async (file: File, settingKey: string) => {
    setUploadingQrKey(settingKey);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Upload failed', 'error');
        setUploadingQrKey(null);
        return;
      }

      setSettings((prev) => ({ ...prev, [settingKey]: data.url }));
      showToast('QR Code image uploaded successfully!', 'success');
    } catch {
      showToast('File upload failed', 'error');
    } finally {
      setUploadingQrKey(null);
    }
  };

  const handleRechargeAction = async (transactionId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/recharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action, adminNote: `Processed by Admin (${action})` })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Action failed', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Network error during action', 'error');
    }
  };

  const handleWithdrawalAction = async (transactionId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action, adminNote: `Processed by Admin (${action})` })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Action failed', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Network error during action', 'error');
    }
  };

  const handleSaveUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newBalance: Number(newBalance) })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update balance', 'error');
        return;
      }
      showToast('User balance updated!', 'success');
      setSelectedUser(null);
      fetchAdminData();
    } catch {
      showToast('Failed to save user', 'error');
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save plan', 'error');
        return;
      }
      showToast(data.message, 'success');
      setShowPlanModal(false);
      fetchAdminData();
    } catch {
      showToast('Failed to save plan', 'error');
    }
  };

  const handleTogglePlan = async (id: number, currentStatus: number) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: currentStatus === 1 ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Plan status updated!', 'success');
        fetchAdminData();
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to save settings', 'error');
        setSavingSettings(false);
        return;
      }

      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 text-center space-y-3 animate-pulse">
        <div className="h-20 bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-0 py-5 space-y-5 pb-16 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-cyan-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-cyan-400">CATL Master Admin Control Center</h2>
            <p className="text-xs text-slate-400">Full System Control, Referral % & QR Image File Uploads</p>
          </div>
        </div>
        <button
          onClick={() => fetchAdminData()}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh System</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1.5 rounded-2xl text-xs font-bold overflow-x-auto border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('recharges')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all flex items-center justify-center ${
            activeTab === 'recharges' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Recharges
          {stats?.pendingRechargesCount ? (
            <span className="ml-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
              {stats.pendingRechargesCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all flex items-center justify-center ${
            activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Withdrawals
          {stats?.pendingWithdrawalsCount ? (
            <span className="ml-1.5 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
              {stats.pendingWithdrawalsCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'plans' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Plans
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-4 rounded-xl whitespace-nowrap transition-all flex items-center justify-center ${
            activeTab === 'settings' ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 mr-1" />
          Settings & QR Uploads
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Registered Users</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total User Balances</span>
              <p className="text-2xl font-black text-blue-600 mt-1">NPR {stats.totalUserBalance.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Active Investments</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalInvestmentsCount}</p>
              <p className="text-[10px] text-blue-600 font-semibold">Vol: NPR {stats.totalInvestedAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Recharges</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingRechargesCount}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Val: NPR {stats.pendingRechargesAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS & ADMIN SECURITY & QR IMAGE FILE UPLOADS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Admin Security & Account Credentials Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-cyan-400 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                  Change Admin ID & Password
                </h3>
                <p className="text-xs text-slate-400">
                  Update your system administrator login email/username and password securely.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminCredentials} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Admin ID / Email / Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="admin@catl.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:outline-none focus:border-blue-500"
                      value={adminCreds.phone_or_email}
                      onChange={(e) => setAdminCreds({ ...adminCreds, phone_or_email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Current Admin Password <span className="text-rose-400">* Required</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:outline-none focus:border-blue-500"
                      value={adminCreds.current_password}
                      onChange={(e) => setAdminCreds({ ...adminCreds, current_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    New Password (Leave blank to keep current)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:outline-none focus:border-blue-500"
                      value={adminCreds.new_password}
                      onChange={(e) => setAdminCreds({ ...adminCreds, new_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:outline-none focus:border-blue-500"
                      value={adminCreds.confirm_password}
                      onChange={(e) => setAdminCreds({ ...adminCreds, confirm_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingCreds}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updatingCreds ? 'Updating Credentials...' : 'Save New Admin Credentials'}</span>
              </button>
            </form>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Referral Commission Control Box */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center">
              <Percent className="w-5 h-5 text-cyan-400 mr-2" />
              Referral Commission Percentage Settings
            </h3>
            <p className="text-xs text-slate-400">
              Admin can configure the exact referral percentage earned on user investment plan subscriptions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tier 1 Direct Referral Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-black text-cyan-400"
                  value={settings.tier1_referral_percent || '10'}
                  onChange={(e) => setSettings({ ...settings, tier1_referral_percent: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tier 2 Indirect Referral Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-black text-cyan-400"
                  value={settings.tier2_referral_percent || '3'}
                  onChange={(e) => setSettings({ ...settings, tier2_referral_percent: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Payment Account Details & File Upload for Payment QR */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center">
              <QrCode className="w-5 h-5 text-cyan-400 mr-2" />
              Payment Accounts & Direct Image Upload for QR Codes
            </h3>
            <p className="text-xs text-slate-400">
              Upload custom QR Code images for eSewa, Khalti, Bank Transfer, and USDT payment gateways.
            </p>

            <div className="space-y-4">
              {/* eSewa */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase">eSewa Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                      value={settings.esewa_account_name || ''}
                      onChange={(e) => setSettings({ ...settings, esewa_account_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">eSewa Mobile ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                      value={settings.esewa_account_number || ''}
                      onChange={(e) => setSettings({ ...settings, esewa_account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Upload QR Code Image</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="esewa-qr-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'esewa_qr_image');
                        }}
                      />
                      <label
                        htmlFor="esewa-qr-upload"
                        className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingQrKey === 'esewa_qr_image' ? 'Uploading...' : 'Choose QR File'}</span>
                      </label>
                      {settings.esewa_qr_image && (
                        <span className="text-[10px] font-mono text-blue-700 font-bold truncate max-w-[100px]">
                          {settings.esewa_qr_image}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Khalti */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase">Khalti Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                      value={settings.khalti_account_name || ''}
                      onChange={(e) => setSettings({ ...settings, khalti_account_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Khalti Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                      value={settings.khalti_account_number || ''}
                      onChange={(e) => setSettings({ ...settings, khalti_account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Upload QR Code Image</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="khalti-qr-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'khalti_qr_image');
                        }}
                      />
                      <label
                        htmlFor="khalti-qr-upload"
                        className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingQrKey === 'khalti_qr_image' ? 'Uploading...' : 'Choose QR File'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase">Bank Transfer Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Bank Account Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                      value={settings.bank_account_name || ''}
                      onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                      value={settings.bank_account_number || ''}
                      onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Upload QR Code Image</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="bank-qr-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'bank_qr_image');
                        }}
                      />
                      <label
                        htmlFor="bank-qr-upload"
                        className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingQrKey === 'bank_qr_image' ? 'Uploading...' : 'Choose QR File'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'Saving Settings...' : 'Save All Admin Settings & Payment Details'}</span>
          </button>
        </form>
      </div>
    )}

      {/* RECHARGES TAB */}
      {activeTab === 'recharges' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            User Deposit Requests ({recharges.length})
          </h3>
          {recharges.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No deposit requests.</p>
          ) : (
            <div className="space-y-3">
              {recharges.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm text-slate-900 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">{r.full_name} ({r.phone_or_email})</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-black text-blue-600">NPR {r.amount.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="font-bold text-slate-900">{r.payment_method}:</span> {r.payment_details}
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      r.status === 'approved' ? 'bg-blue-50 text-blue-700' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status}
                    </span>

                    {r.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRechargeAction(r.id, 'reject')}
                          className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleRechargeAction(r.id, 'approve')}
                          className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 shadow-md shadow-blue-600/30"
                        >
                          Approve Deposit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            User Payout Requests ({withdrawals.length})
          </h3>
          {withdrawals.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No withdrawal requests.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm text-slate-900 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900">{w.full_name} ({w.phone_or_email})</p>
                      <p className="text-[10px] text-slate-400">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-black text-orange-600">NPR {w.amount.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="font-bold text-slate-900">Destination:</span> {w.payment_details}
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      w.status === 'approved' ? 'bg-blue-50 text-blue-700' : w.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {w.status}
                    </span>

                    {w.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'reject')}
                          className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500"
                        >
                          Reject & Refund
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'approve')}
                          className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 shadow-md shadow-blue-600/30"
                        >
                          Approve Payout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Registered Users ({users.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm text-slate-900 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-sm">{u.full_name || 'Member'}</span>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{u.role}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{u.phone_or_email} | Ref: {u.referral_code}</p>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block">Balance</span>
                    <span className="font-black text-blue-600 text-sm">NPR {u.balance.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setNewBalance(u.balance.toString());
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLANS TAB */}
      {activeTab === 'plans' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              CATL Investment Plans ({plans.length})
            </h3>
            <button
              onClick={() => {
                setPlanForm({ id: '', name: '', price: '', daily_income: '', duration_days: '150', vip_level: '1', badge_text: 'VIP 1' });
                setShowPlanModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold rounded-xl text-xs flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm text-slate-900 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                    <p className="text-blue-600 font-black text-sm">NPR {p.price.toFixed(2)}</p>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">
                    {p.badge_text || `VIP ${p.vip_level}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Daily Income</span>
                    <span className="font-bold text-blue-600">NPR {p.daily_income.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Total Revenue</span>
                    <span className="font-bold text-slate-800">NPR {p.total_revenue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Cycle</span>
                    <span className="font-bold text-slate-800">{p.duration_days} Days</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => handleTogglePlan(p.id, p.status)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      p.status === 1 ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status === 1 ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => {
                      setPlanForm({
                        id: p.id.toString(),
                        name: p.name,
                        price: p.price.toString(),
                        daily_income: p.daily_income.toString(),
                        duration_days: p.duration_days.toString(),
                        vip_level: p.vip_level.toString(),
                        badge_text: p.badge_text
                      });
                      setShowPlanModal(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Balance Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-base">Edit User Wallet Balance</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveUserBalance} className="space-y-3 text-xs">
              <p className="text-slate-600">User: <strong>{selectedUser.full_name}</strong> ({selectedUser.phone_or_email})</p>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">New Balance (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 text-base focus:outline-none"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg"
              >
                Update Wallet Balance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-base">{planForm.id ? 'Edit Plan' : 'Add New Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CATL XSUS-5 Energy Matrix"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Price (NPR)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Daily Income (NPR)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                    value={planForm.daily_income}
                    onChange={(e) => setPlanForm({ ...planForm, daily_income: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    value={planForm.duration_days}
                    onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">VIP Tag</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium uppercase"
                    value={planForm.badge_text}
                    onChange={(e) => setPlanForm({ ...planForm, badge_text: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg"
              >
                Save Investment Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
