'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Copy, Check, Share2, Award, ArrowUpRight, ShieldCheck, UserCheck } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface TeamMember {
  id: number;
  phone_or_email: string;
  full_name: string;
  created_at: string;
  total_invested: number | null;
}

export default function TeamPage() {
  const [referralCode, setReferralCode] = useState('');
  const [tier1Members, setTier1Members] = useState<TeamMember[]>([]);
  const [tier1Count, setTier1Count] = useState(0);
  const [tier2Count, setTier2Count] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setReferralCode(data.referralCode);
        setTier1Members(data.tier1Members || []);
        setTier1Count(data.tier1Count || 0);
        setTier2Count(data.tier2Count || 0);
        setTotalCommission(data.totalCommission || 0);
      }
    } catch {
      showToast('Failed to load team details', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${originUrl}/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast('Referral Code copied!', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('Referral Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse max-w-5xl mx-auto">
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="h-48 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-5xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-cyan-400" />
              Referral Team & Rewards
            </h2>
            <p className="text-xs text-cyan-400 font-semibold mt-0.5">
              Earn 10% Tier-1 & 3% Tier-2 commission on investments!
            </p>
          </div>
          <span className="bg-blue-600/30 border border-blue-500/40 text-cyan-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Commission Matrix
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tier 1 Team</p>
            <p className="text-lg font-black text-white">{tier1Count}</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tier 2 Team</p>
            <p className="text-lg font-black text-white">{tier2Count}</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Earned</p>
            <p className="text-lg font-black text-cyan-400">NPR {totalCommission.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Invitation QR & Code Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4">
        <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center justify-center">
          <Share2 className="w-4 h-4 text-blue-600 mr-1.5" />
          Your Unique Invitation Link
        </h3>

        {/* QR Code */}
        {referralCode && (
          <div className="bg-slate-50 p-3 inline-block rounded-2xl border border-slate-200 shadow-inner">
            <QRCodeSVG value={referralLink} size={140} fgColor="#0f172a" />
          </div>
        )}

        {/* Referral Code Box */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block text-left">Referral Code</span>
            <span className="font-black text-slate-900 tracking-wider text-base">{referralCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl flex items-center space-x-1 transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
        >
          {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? 'Link Copied To Clipboard!' : 'Copy Full Invite Link'}</span>
        </button>
      </div>

      {/* Commission Rules Card */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-5 space-y-3 text-xs shadow-sm">
        <h4 className="font-black text-blue-950 flex items-center">
          <Award className="w-4 h-4 mr-2 text-blue-600" />
          How CATL Referral Commission Works:
        </h4>
        <ul className="space-y-2 text-blue-900">
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">•</span>
            <span><strong className="text-blue-950">Tier 1 (Direct Referrals - 10%):</strong> You earn an instant 10% cash commission whenever a user registered via your link invests in any CATL plan.</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">•</span>
            <span><strong className="text-blue-950">Tier 2 (Indirect Referrals - 3%):</strong> You earn 3% instant commission when users invited by your Tier 1 members invest!</span>
          </li>
        </ul>
      </div>

      {/* Direct Team List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
          <UserCheck className="w-4 h-4 text-blue-600 mr-1.5" />
          Direct Team Members ({tier1Members.length})
        </h3>

        {tier1Members.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No direct team members yet. Share your invitation link to build your energy team!
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {tier1Members.map((member) => (
              <div key={member.id} className="py-3 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">{member.full_name || member.phone_or_email}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Joined: {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Invested</span>
                  <span className="font-black text-blue-600">
                    NPR {member.total_invested ? Number(member.total_invested).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
