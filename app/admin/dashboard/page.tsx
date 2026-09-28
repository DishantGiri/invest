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
  Trash2,
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
  EyeOff,
  Gift,
  Tag,
  Award,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'recharges' | 'withdrawals' | 'users' | 'plans' | 'investments' | 'gift-codes' | 'settings'
  >('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
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

  // User CRUD Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    id: '',
    full_name: '',
    phone_or_email: '',
    password: '',
    role: 'user',
    balance: '0',
    total_income: '0',
    total_recharge: '0',
    total_withdrawal: '0',
    bank_name: '',
    account_name: '',
    account_number: '',
    referred_by: ''
  });

  // Plan CRUD Modal State
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

  // Investment CRUD Modal State
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    id: '',
    user_id: '',
    plan_id: '',
    plan_name: '',
    invest_price: '',
    daily_income: '',
    duration_days: '150',
    days_passed: '0',
    total_claimed: '0',
    status: 'active'
  });

  // Transaction (Recharge / Withdrawal) CRUD Modal State
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnForm, setTxnForm] = useState({
    id: '',
    type: 'recharge' as 'recharge' | 'withdrawal',
    user_id: '',
    amount: '',
    payment_method: 'eSewa',
    payment_details: '',
    status: 'approved',
    admin_note: ''
  });

  // Gift Code CRUD Modal State
  const [showGiftCodeModal, setShowGiftCodeModal] = useState(false);
  const [giftCodeForm, setGiftCodeForm] = useState({
    id: '',
    code: '',
    amount: '',
    max_uses: '100'
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

      const iRes = await fetch('/api/admin/investments');
      const iData = await iRes.json();
      if (iData.investments) setInvestments(iData.investments);

      const gRes = await fetch('/api/admin/gift-codes');
      const gData = await gRes.json();
      if (gData.giftCodes) setGiftCodes(gData.giftCodes);

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

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Admin Credentials handler
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
      showToast(data.message || 'Admin credentials updated successfully!', 'success');
      setAdminCreds((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch {
      showToast('Error updating admin credentials', 'error');
    } finally {
      setUpdatingCreds(false);
    }
  };

  // QR & Image File Upload
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

      const saveRes = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [settingKey]: data.url })
      });

      if (saveRes.ok) {
        showToast('Image uploaded and saved to settings!', 'success');
      }
    } catch {
      showToast('File upload failed', 'error');
    } finally {
      setUploadingQrKey(null);
    }
  };

  // User Save (Create/Update) & Delete
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: userForm.id ? 'update' : 'create',
          userId: userForm.id,
          full_name: userForm.full_name,
          phone_or_email: userForm.phone_or_email,
          password: userForm.password,
          new_password: userForm.password,
          role: userForm.role,
          balance: Number(userForm.balance),
          total_income: Number(userForm.total_income),
          total_recharge: Number(userForm.total_recharge),
          total_withdrawal: Number(userForm.total_withdrawal),
          bank_name: userForm.bank_name,
          account_name: userForm.account_name,
          account_number: userForm.account_number,
          referred_by: userForm.referred_by
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save user', 'error');
        return;
      }
      showToast(data.message, 'success');
      setShowUserModal(false);
      fetchAdminData();
    } catch {
      showToast('Error saving user', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to permanently delete this user and all associated records?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete user', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  // Plan Save & Delete
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

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this investment plan?')) return;
    try {
      const res = await fetch(`/api/admin/plans?id=${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete plan', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Failed to delete plan', 'error');
    }
  };

  // User Investment Save & Delete
  const handleSaveInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: investmentForm.id ? 'update' : 'create',
          id: investmentForm.id,
          user_id: investmentForm.user_id,
          plan_id: investmentForm.plan_id,
          plan_name: investmentForm.plan_name,
          invest_price: investmentForm.invest_price,
          daily_income: investmentForm.daily_income,
          duration_days: investmentForm.duration_days,
          days_passed: investmentForm.days_passed,
          total_claimed: investmentForm.total_claimed,
          status: investmentForm.status
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save investment', 'error');
        return;
      }
      showToast(data.message, 'success');
      setShowInvestmentModal(false);
      fetchAdminData();
    } catch {
      showToast('Failed to save investment', 'error');
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user investment record?')) return;
    try {
      const res = await fetch(`/api/admin/investments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete investment', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Failed to delete investment', 'error');
    }
  };

  // Recharge / Withdrawal Action, Save & Delete
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

  const handleSaveTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = txnForm.type === 'recharge' ? '/api/admin/recharges' : '/api/admin/withdrawals';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: txnForm.id ? 'edit' : 'create',
          transactionId: txnForm.id,
          user_id: txnForm.user_id,
          amount: Number(txnForm.amount),
          payment_method: txnForm.payment_method,
          payment_details: txnForm.payment_details,
          status: txnForm.status,
          adminNote: txnForm.admin_note
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save transaction', 'error');
        return;
      }
      showToast(data.message, 'success');
      setShowTxnModal(false);
      fetchAdminData();
    } catch {
      showToast('Failed to save transaction', 'error');
    }
  };

  const handleDeleteTxn = async (id: number, type: 'recharge' | 'withdrawal') => {
    if (!confirm(`Are you sure you want to delete this ${type} transaction record?`)) return;
    const endpoint = type === 'recharge' ? `/api/admin/recharges?id=${id}` : `/api/admin/withdrawals?id=${id}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete transaction', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Failed to delete transaction', 'error');
    }
  };

  // Gift Code Save & Delete
  const handleSaveGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftCodeForm)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save gift code', 'error');
        return;
      }
      showToast(data.message, 'success');
      setShowGiftCodeModal(false);
      fetchAdminData();
    } catch {
      showToast('Failed to save gift code', 'error');
    }
  };

  const handleDeleteGiftCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gift code?')) return;
    try {
      const res = await fetch(`/api/admin/gift-codes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete gift code', 'error');
        return;
      }
      showToast(data.message, 'success');
      fetchAdminData();
    } catch {
      showToast('Failed to delete gift code', 'error');
    }
  };

  // Settings Save
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
      <div className="p-8 text-center space-y-4 animate-pulse max-w-6xl mx-auto">
        <div className="h-20 bg-slate-800 rounded-3xl" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-0 py-5 space-y-6 pb-20 max-w-6xl mx-auto text-slate-900">
      {/* Admin Header Banner */}
      <div className="bg-slate-950 rounded-3xl p-6 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-cyan-400 flex items-center justify-center font-bold shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-cyan-400 tracking-tight">CATL Master Admin Control Center</h2>
            <p className="text-xs text-slate-400">Full System Control, User CRUD, Financial Limits & Settings</p>
          </div>
        </div>

        <button
          onClick={() => fetchAdminData()}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-2 border border-slate-800 transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Refresh System</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1.5 bg-white p-2 rounded-2xl text-xs font-bold overflow-x-auto border border-slate-200/90 shadow-sm scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'recharges', label: 'Deposits', badge: stats?.pendingRechargesCount, badgeColor: 'bg-rose-500', icon: ArrowDownLeft },
          { id: 'withdrawals', label: 'Withdrawals', badge: stats?.pendingWithdrawalsCount, badgeColor: 'bg-amber-500', icon: ArrowUpRight },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'plans', label: 'Plans', icon: Award },
          { id: 'investments', label: 'User Plans', icon: Star },
          { id: 'gift-codes', label: 'Gift Codes', icon: Gift },
          { id: 'settings', label: 'Settings & Min Limits', icon: Sliders }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full text-white ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Users</span>
              <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
              <span className="text-[10px] text-blue-600 font-bold">Registered Members</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total User Balances</span>
              <p className="text-2xl font-black text-blue-600">NPR {stats.totalUserBalance.toFixed(2)}</p>
              <span className="text-[10px] text-slate-500 font-bold">Wallet Balances</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Investments</span>
              <p className="text-2xl font-black text-slate-900">{stats.totalInvestmentsCount}</p>
              <span className="text-[10px] text-emerald-600 font-bold">Vol: NPR {stats.totalInvestedAmount.toFixed(2)}</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Deposits</span>
              <p className="text-2xl font-black text-rose-600">{stats.pendingRechargesCount}</p>
              <span className="text-[10px] text-slate-500 font-bold">Val: NPR {stats.pendingRechargesAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dynamic Minimum Limits Highlight */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center">
                <Sliders className="w-4 h-4 mr-2 text-cyan-400" />
                Active Financial Rules & Limits
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Min Deposit Amount</span>
                  <span className="text-lg font-black text-emerald-400">NPR {settings.min_recharge || '500'}</span>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Min Withdrawal Amount</span>
                  <span className="text-lg font-black text-amber-400">NPR {settings.min_withdraw || '300'}</span>
                </div>
              </div>
            </div>

            {/* Support Link Info */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                WhatsApp Customer Care
              </h3>
              <p className="text-xs text-slate-300">
                Official WhatsApp Support URL displayed to users on deposit and support pages:
              </p>
              <a
                href={settings.whatsapp_support_link || settings.telegram_support_link || 'https://wa.me/message/UBPVDRWPZGS7H1?src=qr'}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-mono font-bold text-emerald-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 underline truncate max-w-full"
              >
                {settings.whatsapp_support_link || settings.telegram_support_link || 'https://wa.me/message/UBPVDRWPZGS7H1?src=qr'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. RECHARGES / DEPOSITS TAB */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Deposit & Wallet Recharge Records ({recharges.length})
            </h3>
            <button
              onClick={() => {
                setTxnForm({
                  id: '',
                  type: 'recharge',
                  user_id: users[0]?.id?.toString() || '',
                  amount: '1000',
                  payment_method: 'eSewa',
                  payment_details: 'Manual Deposit by Admin',
                  status: 'approved',
                  admin_note: 'Direct Admin Credit'
                });
                setShowTxnModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Manual Deposit
            </button>
          </div>

          {recharges.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No deposit requests recorded.</p>
          ) : (
            <div className="space-y-3">
              {recharges.map((r) => (
                <div key={r.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{r.full_name || 'User'} ({r.phone_or_email})</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-blue-600 block">NPR {r.amount.toFixed(2)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : r.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="font-bold text-cyan-400">{r.payment_method}:</span> {r.payment_details}
                    {r.admin_note && <p className="text-[10px] text-slate-400 mt-1 italic">Note: {r.admin_note}</p>}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <div className="flex space-x-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRechargeAction(r.id, 'reject')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleRechargeAction(r.id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm"
                          >
                            Approve & Credit Balance
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          setTxnForm({
                            id: r.id.toString(),
                            type: 'recharge',
                            user_id: r.user_id.toString(),
                            amount: r.amount.toString(),
                            payment_method: r.payment_method || 'eSewa',
                            payment_details: r.payment_details || '',
                            status: r.status,
                            admin_note: r.admin_note || ''
                          });
                          setShowTxnModal(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTxn(r.id, 'recharge')}
                        className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Payout & Withdrawal Requests ({withdrawals.length})
            </h3>
            <button
              onClick={() => {
                setTxnForm({
                  id: '',
                  type: 'withdrawal',
                  user_id: users[0]?.id?.toString() || '',
                  amount: '500',
                  payment_method: 'eSewa',
                  payment_details: 'Manual Withdrawal processed by Admin',
                  status: 'approved',
                  admin_note: 'Manual Admin Payout'
                });
                setShowTxnModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Manual Payout
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No withdrawal requests recorded.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{w.full_name || 'User'} ({w.phone_or_email})</p>
                      <p className="text-[10px] text-slate-400">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-600 block">NPR {w.amount.toFixed(2)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        w.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : w.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="font-bold text-cyan-400">Destination:</span> {w.payment_details}
                    {w.admin_note && <p className="text-[10px] text-slate-400 mt-1 italic">Note: {w.admin_note}</p>}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <div className="flex space-x-2">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'reject')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                          >
                            Reject & Refund Wallet
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm"
                          >
                            Approve Payout
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          setTxnForm({
                            id: w.id.toString(),
                            type: 'withdrawal',
                            user_id: w.user_id.toString(),
                            amount: w.amount.toString(),
                            payment_method: w.payment_method || 'eSewa',
                            payment_details: w.payment_details || '',
                            status: w.status,
                            admin_note: w.admin_note || ''
                          });
                          setShowTxnModal(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTxn(w.id, 'withdrawal')}
                        className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Registered System Users ({users.length})
            </h3>
            <button
              onClick={() => {
                setUserForm({
                  id: '',
                  full_name: '',
                  phone_or_email: '',
                  password: '',
                  role: 'user',
                  balance: '0',
                  total_income: '0',
                  total_recharge: '0',
                  total_withdrawal: '0',
                  bank_name: '',
                  account_name: '',
                  account_number: '',
                  referred_by: ''
                });
                setShowUserModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create New User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm">{u.full_name || 'Member'}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{u.phone_or_email} | Ref: {u.referral_code}</p>
                    {u.referred_by && <p className="text-[10px] text-slate-400">Referred by: {u.referred_by}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Wallet Balance</span>
                    <span className="font-black text-blue-600 text-sm">NPR {u.balance.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center font-semibold text-[10px]">
                  <div>
                    <span className="text-slate-400 block uppercase">Income</span>
                    <span className="text-emerald-600 font-bold">NPR {u.total_income?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Recharged</span>
                    <span className="text-blue-600 font-bold">NPR {u.total_recharge?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Withdrawn</span>
                    <span className="text-amber-600 font-bold">NPR {u.total_withdrawal?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {u.account_number && (
                  <div className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded-lg font-mono">
                    Bank: {u.bank_name} | {u.account_number} ({u.account_name})
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setUserForm({
                        id: u.id.toString(),
                        full_name: u.full_name || '',
                        phone_or_email: u.phone_or_email || '',
                        password: '',
                        role: u.role || 'user',
                        balance: u.balance?.toString() || '0',
                        total_income: u.total_income?.toString() || '0',
                        total_recharge: u.total_recharge?.toString() || '0',
                        total_withdrawal: u.total_withdrawal?.toString() || '0',
                        bank_name: u.bank_name || '',
                        account_name: u.account_name || '',
                        account_number: u.account_number || '',
                        referred_by: u.referred_by || ''
                      });
                      setShowUserModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit User</span>
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PLANS TAB */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Investment Plans ({plans.length})
            </h3>
            <button
              onClick={() => {
                setPlanForm({ id: '', name: '', price: '', daily_income: '', duration_days: '150', vip_level: '1', badge_text: 'VIP 1' });
                setShowPlanModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-blue-600 font-black text-base">NPR {p.price.toFixed(2)}</p>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-xl">
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

                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleTogglePlan(p.id, p.status)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                      p.status === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.status === 1 ? 'Active' : 'Disabled'}
                  </button>

                  <div className="flex space-x-1.5">
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
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. USER INVESTMENTS TAB */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              User Purchased Investment Plans ({investments.length})
            </h3>
            <button
              onClick={() => {
                setInvestmentForm({
                  id: '',
                  user_id: users[0]?.id?.toString() || '',
                  plan_id: plans[0]?.id?.toString() || '1',
                  plan_name: plans[0]?.name || 'CATL Energy Plan',
                  invest_price: plans[0]?.price?.toString() || '1100',
                  daily_income: plans[0]?.daily_income?.toString() || '380',
                  duration_days: '150',
                  days_passed: '0',
                  total_claimed: '0',
                  status: 'active'
                });
                setShowInvestmentModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Assign Plan to User
            </button>
          </div>

          {investments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No user investments active yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investments.map((inv) => (
                <div key={inv.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{inv.plan_name}</h4>
                      <p className="text-[11px] text-slate-500">{inv.full_name} ({inv.phone_or_email})</p>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      inv.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center font-semibold text-[10px]">
                    <div>
                      <span className="text-slate-400 block uppercase">Price</span>
                      <span className="text-blue-600 font-bold">NPR {inv.invest_price?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase">Daily</span>
                      <span className="text-emerald-600 font-bold">NPR {inv.daily_income?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase">Progress</span>
                      <span className="text-slate-800 font-bold">{inv.days_passed}/{inv.duration_days} Days</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">
                      Claimed: <strong>NPR {inv.total_claimed?.toFixed(2) || '0.00'}</strong>
                    </span>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          setInvestmentForm({
                            id: inv.id.toString(),
                            user_id: inv.user_id.toString(),
                            plan_id: inv.plan_id.toString(),
                            plan_name: inv.plan_name,
                            invest_price: inv.invest_price.toString(),
                            daily_income: inv.daily_income.toString(),
                            duration_days: inv.duration_days.toString(),
                            days_passed: inv.days_passed.toString(),
                            total_claimed: inv.total_claimed?.toString() || '0',
                            status: inv.status
                          });
                          setShowInvestmentModal(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. GIFT CODES TAB */}
      {activeTab === 'gift-codes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Gift Voucher & Reward Codes ({giftCodes.length})
            </h3>
            <button
              onClick={() => {
                setGiftCodeForm({ id: '', code: 'CATL' + Math.floor(1000 + Math.random() * 9000), amount: '150', max_uses: '100' });
                setShowGiftCodeModal(true);
              }}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Gift Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {giftCodes.map((gc) => (
              <div key={gc.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-base font-black font-mono text-blue-600 block">{gc.code}</span>
                    <span className="text-[10px] text-slate-400">Created: {new Date(gc.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-base font-black text-emerald-600">NPR {gc.amount.toFixed(2)}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-600">Uses Limit: <strong>{gc.max_uses}</strong></span>
                  <span className="text-slate-600">Times Claimed: <strong>{gc.times_used || gc.actual_claims || 0}</strong></span>
                </div>

                <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setGiftCodeForm({
                        id: gc.id.toString(),
                        code: gc.code,
                        amount: gc.amount.toString(),
                        max_uses: gc.max_uses.toString()
                      });
                      setShowGiftCodeModal(true);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGiftCode(gc.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. SETTINGS & ADMIN SECURITY & QR UPLOADS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Admin Credentials Form */}
          <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-cyan-400 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                  Update Admin Login Credentials
                </h3>
                <p className="text-xs text-slate-400">
                  Change admin ID / email and master password securely.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminCredentials} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Admin ID / Email
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-medium text-white"
                    value={adminCreds.phone_or_email}
                    onChange={(e) => setAdminCreds({ ...adminCreds, phone_or_email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Current Password <span className="text-rose-400">* Required</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-medium text-white"
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
                    New Password
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-medium text-white"
                    value={adminCreds.new_password}
                    onChange={(e) => setAdminCreds({ ...adminCreds, new_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-medium text-white"
                    value={adminCreds.confirm_password}
                    onChange={(e) => setAdminCreds({ ...adminCreds, confirm_password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingCreds}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updatingCreds ? 'Updating Admin Credentials...' : 'Save New Admin Credentials'}</span>
              </button>
            </form>
          </div>

          {/* System Rules & Financial Limits Form */}
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* MINIMUM DEPOSIT & MINIMUM WITHDRAWAL CONTROL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                <Sliders className="w-5 h-5 text-blue-600 mr-2" />
                Minimum Deposit & Withdrawal Limits (NPR)
              </h3>
              <p className="text-xs text-slate-500">
                Set minimum allowable deposit and withdrawal values across user wallet pages dynamically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Minimum Deposit / Recharge (NPR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-blue-600 focus:bg-white focus:outline-none focus:border-blue-600"
                    value={settings.min_recharge || '500'}
                    onChange={(e) => setSettings({ ...settings, min_recharge: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Minimum Withdrawal Amount (NPR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-amber-600 focus:bg-white focus:outline-none focus:border-blue-600"
                    value={settings.min_withdraw || '300'}
                    onChange={(e) => setSettings({ ...settings, min_withdraw: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* REFERRAL COMMISSION SETTINGS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                <Percent className="w-5 h-5 text-blue-600 mr-2" />
                Referral Commission Percentages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Tier 1 Direct Referral (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900"
                    value={settings.tier1_referral_percent || '10'}
                    onChange={(e) => setSettings({ ...settings, tier1_referral_percent: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Tier 2 Indirect Referral (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900"
                    value={settings.tier2_referral_percent || '3'}
                    onChange={(e) => setSettings({ ...settings, tier2_referral_percent: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* CUSTOMER SUPPORT LINK */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                <MessageCircle className="w-5 h-5 text-emerald-600 mr-2" />
                Customer Support WhatsApp Link
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  WhatsApp Customer Support URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://wa.me/message/UBPVDRWPZGS7H1?src=qr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900"
                  value={settings.whatsapp_support_link || settings.telegram_support_link || 'https://wa.me/message/UBPVDRWPZGS7H1?src=qr'}
                  onChange={(e) => setSettings({ ...settings, whatsapp_support_link: e.target.value, telegram_support_link: e.target.value })}
                />
              </div>
            </div>

            {/* PAYMENT GATEWAY ACCOUNTS & QR UPLOADS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                <QrCode className="w-5 h-5 text-blue-600 mr-2" />
                Payment Gateway Accounts & QR Images
              </h3>

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
                          id="esewa-qr"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'esewa_qr_image')}
                        />
                        <label htmlFor="esewa-qr" className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingQrKey === 'esewa_qr_image' ? 'Uploading...' : 'Choose Image'}</span>
                        </label>
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
                          id="khalti-qr"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'khalti_qr_image')}
                        />
                        <label htmlFor="khalti-qr" className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingQrKey === 'khalti_qr_image' ? 'Uploading...' : 'Choose Image'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase">Bank Transfer Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Bank Name & Holder</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                        value={settings.bank_account_name || ''}
                        onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Account Number</label>
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
                          id="bank-qr"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bank_qr_image')}
                        />
                        <label htmlFor="bank-qr" className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingQrKey === 'bank_qr_image' ? 'Uploading...' : 'Choose Image'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* USDT */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase">USDT (TRC20 Crypto) Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">USDT TRC20 Address</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        value={settings.usdt_address || ''}
                        onChange={(e) => setSettings({ ...settings, usdt_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Upload QR Code Image</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="usdt-qr"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'usdt_qr_image')}
                        />
                        <label htmlFor="usdt-qr" className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingQrKey === 'usdt_qr_image' ? 'Uploading...' : 'Choose Image'}</span>
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving All Settings...' : 'Save System Settings & Financial Limits'}</span>
            </button>
          </form>
        </div>
      )}

      {/* USER CRUD MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">{userForm.id ? 'Edit User Profile & Financials' : 'Create New User Account'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone / Email</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={userForm.phone_or_email}
                    onChange={(e) => setUserForm({ ...userForm, phone_or_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {userForm.id ? 'Reset Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="text"
                    placeholder={userForm.id ? 'Leave blank to keep' : 'Account password'}
                    required={!userForm.id}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Wallet Balance (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-600"
                    value={userForm.balance}
                    onChange={(e) => setUserForm({ ...userForm, balance: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total Income (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                    value={userForm.total_income}
                    onChange={(e) => setUserForm({ ...userForm, total_income: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total Recharge (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={userForm.total_recharge}
                    onChange={(e) => setUserForm({ ...userForm, total_recharge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total Withdrawal (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={userForm.total_withdrawal}
                    onChange={(e) => setUserForm({ ...userForm, total_withdrawal: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border space-y-2">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-500">Bank Details</h4>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Bank / eSewa"
                    className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={userForm.bank_name}
                    onChange={(e) => setUserForm({ ...userForm, bank_name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Account Name"
                    className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={userForm.account_name}
                    onChange={(e) => setUserForm({ ...userForm, account_name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    value={userForm.account_number}
                    onChange={(e) => setUserForm({ ...userForm, account_number: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg"
              >
                {userForm.id ? 'Save User Changes' : 'Create User Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PLAN CRUD MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">{planForm.id ? 'Edit Investment Plan' : 'Add New Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CATL Super Grid X1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Daily Income</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    value={planForm.duration_days}
                    onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                    value={planForm.badge_text}
                    onChange={(e) => setPlanForm({ ...planForm, badge_text: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg"
              >
                Save Investment Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USER INVESTMENT CRUD MODAL */}
      {showInvestmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">{investmentForm.id ? 'Edit User Investment' : 'Assign Investment to User'}</h3>
              <button onClick={() => setShowInvestmentModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveInvestment} className="space-y-3 text-xs">
              {!investmentForm.id && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Select Target User</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    value={investmentForm.user_id}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || 'Member'} ({u.phone_or_email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  value={investmentForm.plan_name}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, plan_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Investment Price</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                    value={investmentForm.invest_price}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, invest_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Daily Income</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                    value={investmentForm.daily_income}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, daily_income: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Days Passed</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={investmentForm.days_passed}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, days_passed: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={investmentForm.status}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg"
              >
                Save Investment Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION EDIT/CREATE MODAL */}
      {showTxnModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {txnForm.id ? `Edit ${txnForm.type} Record` : `Add Manual ${txnForm.type}`}
              </h3>
              <button onClick={() => setShowTxnModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveTxn} className="space-y-3 text-xs">
              {!txnForm.id && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target User</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={txnForm.user_id}
                    onChange={(e) => setTxnForm({ ...txnForm, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || 'Member'} ({u.phone_or_email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Amount (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-600"
                  value={txnForm.amount}
                  onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Method</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={txnForm.payment_method}
                    onChange={(e) => setTxnForm({ ...txnForm, payment_method: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={txnForm.status}
                    onChange={(e) => setTxnForm({ ...txnForm, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Payment Details</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                  value={txnForm.payment_details}
                  onChange={(e) => setTxnForm({ ...txnForm, payment_details: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Admin Note</label>
                <input
                  type="text"
                  placeholder="Internal admin remark"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                  value={txnForm.admin_note}
                  onChange={(e) => setTxnForm({ ...txnForm, admin_note: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg"
              >
                Save Transaction Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GIFT CODE CRUD MODAL */}
      {showGiftCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">{giftCodeForm.id ? 'Edit Gift Code' : 'Create Gift Code'}</h3>
              <button onClick={() => setShowGiftCodeModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveGiftCode} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Gift Code Text</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CATL2026"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black font-mono uppercase text-blue-600"
                  value={giftCodeForm.code}
                  onChange={(e) => setGiftCodeForm({ ...giftCodeForm, code: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reward Amount (NPR)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                    value={giftCodeForm.amount}
                    onChange={(e) => setGiftCodeForm({ ...giftCodeForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Max Claim Limit</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    value={giftCodeForm.max_uses}
                    onChange={(e) => setGiftCodeForm({ ...giftCodeForm, max_uses: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg"
              >
                Save Gift Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
