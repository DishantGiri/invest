import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db, { getSystemSettings } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.prepare("SELECT referral_code FROM users WHERE id = ?").get(session.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = getSystemSettings();

    // Direct Tier 1 Referrals
    const tier1Members = db.prepare(`
      SELECT id, phone_or_email, full_name, created_at,
             (SELECT SUM(invest_price) FROM user_investments WHERE user_id = users.id) as total_invested
      FROM users
      WHERE referred_by = ?
      ORDER BY id DESC
    `).all(user.referral_code);

    // Tier 2 Referral Count
    const tier1Codes = tier1Members.map((m: any) => m.referral_code).filter(Boolean);
    let tier2Count = 0;
    if (tier1Codes.length > 0) {
      const placeholders = tier1Codes.map(() => '?').join(',');
      const result = db.prepare(`SELECT COUNT(*) as count FROM users WHERE referred_by IN (${placeholders})`).get(...tier1Codes) as any;
      tier2Count = result?.count || 0;
    }

    // Total Referral Commission Earned
    const commissionSum = db.prepare(`
      SELECT SUM(amount) as total FROM referral_commissions WHERE referrer_id = ?
    `).get(session.id) as any;

    const totalCommission = commissionSum?.total || 0;

    return NextResponse.json({
      success: true,
      referralCode: user.referral_code,
      tier1Members,
      tier1Count: tier1Members.length,
      tier2Count,
      totalCommission,
      tier1Percent: settings.tier1_referral_percent || '10',
      tier2Percent: settings.tier2_referral_percent || '3'
    });
  } catch (error: any) {
    console.error('Team Error:', error);
    return NextResponse.json({ error: 'Failed to load team data' }, { status: 500 });
  }
}
