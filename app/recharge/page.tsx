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
    <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <Star className="w-6 h-6 fill-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Wallet Recharge</h2>
            <p className="text-xs text-cyan-400 font-semibold">
              Scan QR code & submit deposit request
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Payment QR Box */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center justify-center">
            <QrCode className="w-4 h-4 text-blue-600 mr-1.5" />
            Scan QR Code to Pay ({paymentMethod})
          </h3>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-inner relative w-52 h-52">
            <Image
              src={currentPaymentInfo.qrImage}
              alt="Payment Gateway QR Code"
              fill
              className="object-contain p-1"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 w-full text-xs text-slate-600 space-y-1 text-left">
            <p className="font-extrabold text-slate-900">Official Gateway Instructions:</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1. Scan QR code in your eSewa/Khalti/Bank app.<br />
              2. Transfer exact NPR amount.<br />
              3. Enter Transaction ID & upload payment receipt.
            </p>
          </div>
        </div>

        {/* Recharge Form */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Select Deposit Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['eSewa', 'Khalti', 'Bank Transfer', 'USDT'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-slate-900'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Recharge Amount (NPR)
              </label>
              <input
                type="number"
                required
                min="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-blue-600 focus:outline-none focus:border-blue-600 focus:bg-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className="py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    NPR {amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Sender Transaction ID / Mobile ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TXN98412389123"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                value={senderInfo}
                onChange={(e) => setSenderInfo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Upload Payment Screenshot
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-3 text-center transition-all">
                  <span className="text-xs font-bold text-slate-700 flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploadingProof ? 'Uploading Screenshot...' : proofImageUrl ? 'Change Screenshot' : 'Choose Receipt File'}</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProofFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {proofImageUrl && (
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-950 font-bold">
                  <span className="flex items-center">
                    <FileCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                    Receipt Screenshot Attached
                  </span>
                  <a href={proofImageUrl} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-700">
                    Preview
                  </a>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Submitting Deposit...' : 'Submit Deposit Request'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Recharge Transaction History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No deposit history recorded yet.</p>
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
