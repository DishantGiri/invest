'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Upload, ArrowRight, CheckCircle2, Clock, XCircle, QrCode, FileCheck } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface Transaction {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_method: string;
  payment_details: string;
  created_at: string;
}

export default function RechargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('1100');
  const [paymentMethod, setPaymentMethod] = useState('eSewa');
  const [senderInfo, setSenderInfo] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const presetAmounts = ['1100', '2500', '5000', '12000', '28000'];

  const fetchRechargeData = useCallback(async () => {
    try {
      const res = await fetch('/api/recharge');
      const data = await res.json();
      if (data.recharges) setHistory(data.recharges);
      if (data.settings) setSettings(data.settings);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchRechargeData();
  }, [fetchRechargeData]);

  const handleProofFileUpload = async (file: File) => {
    setUploadingProof(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Proof upload failed', 'error');
        setUploadingProof(false);
        return;
      }

      setProofImageUrl(data.url);
      showToast('Payment receipt screenshot attached successfully!', 'success');
    } catch {
      showToast('Failed to upload proof screenshot', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let detailsStr = '';
    if (senderInfo.trim()) detailsStr += `Sender: ${senderInfo.trim()}`;
    if (proofImageUrl) detailsStr += `${detailsStr ? ' | ' : ''}Proof Image: ${proofImageUrl}`;

    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          payment_method: paymentMethod,
          sender_info: detailsStr
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Recharge request failed', 'error');
        setLoading(false);
        return;
      }

      showToast(data.message, 'success');
      setSenderInfo('');
      setProofImageUrl('');
      fetchRechargeData();
    } catch {
      showToast('Network error while processing deposit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = (method: string) => {
    switch (method) {
      case 'eSewa':
        return { qrImage: settings.esewa_qr_image || '/payment_qr.png' };
      case 'Khalti':
        return { qrImage: settings.khalti_qr_image || '/payment_qr.png' };
      case 'Bank Transfer':
        return { qrImage: settings.bank_qr_image || '/payment_qr.png' };
      case 'USDT':
        return { qrImage: settings.usdt_qr_image || '/payment_qr.png' };
      default:
        return { qrImage: '/payment_qr.png' };
    }
  };

  const currentPaymentInfo = getPaymentDetails(paymentMethod);

  return (
    <div className="px-4 py-5 space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-emerald-950 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-emerald-950" />
          </div>
          <div>
            <h2 className="text-lg font-black text-emerald-400">Wallet Recharge</h2>
            <p className="text-xs text-emerald-200/80">
              Scan QR code & submit deposit request
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Payment QR Box */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-center">
            <QrCode className="w-4 h-4 text-emerald-600 mr-1.5" />
            Scan QR Code to Pay ({paymentMethod})
          </h3>

          {/* QR Image preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
            <div className="relative w-56 h-56 mx-auto rounded-xl overflow-hidden">
              <Image
                src={currentPaymentInfo.qrImage}
                alt="Payment QR Code"
                width={240}
                height={240}
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Select Deposit Amount (NPR)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`py-2 rounded-xl font-black text-xs transition-all border ${
                    amount === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  NPR {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Gateway / Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['eSewa', 'Khalti', 'Bank Transfer', 'USDT'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-all ${
                    paymentMethod === m
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{m}</span>
                  {paymentMethod === m && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Upload Receipt Screenshot (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  id="recharge-proof-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleProofFileUpload(e.target.files[0]);
                  }}
                />
                <label
                  htmlFor="recharge-proof-upload"
                  className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 text-xs border border-slate-200 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{uploadingProof ? 'Uploading Receipt...' : 'Attach Receipt Image'}</span>
                </label>
                {proofImageUrl && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <FileCheck className="w-4 h-4 mr-1" />
                    Attached
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Sender Name / Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="Your name or phone used for payment"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                value={senderInfo}
                onChange={(e) => setSenderInfo(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <span>{loading ? 'Submitting Request...' : `Submit Deposit (NPR ${amount})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Deposit History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Recharge Request History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">No previous deposit requests.</p>
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
                      ? 'bg-emerald-100 text-emerald-700'
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
