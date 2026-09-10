import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, getSystemSettings } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await queryOne<{ referral_code: string }>('SELECT referral_code FROM users WHERE id = ?', [session.id]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await getSystemSettings();

    // Direct Tier 1 Referrals
    const tier1Members = await query<any>(`
      SELECT id, phone_or_email, full_name, referral_code, created_at,
             COALESCE((SELECT SUM(invest_price) FROM user_investments WHERE user_id = users.id), 0) as total_invested
      FROM users
      WHERE referred_by = ?
      ORDER BY id DESC
    `, [user.referral_code]);

    // Tier 2 Referral Count
    const tier1Codes = tier1Members.map((m: any) => m.referral_code).filter(Boolean);
    let tier2Count = 0;
    if (tier1Codes.length > 0) {
      const placeholders = tier1Codes.map(() => '?').join(',');
      const result = await queryOne<{ count: any }>(`SELECT COUNT(*) as count FROM users WHERE referred_by IN (${placeholders})`, tier1Codes);
      tier2Count = parseInt(result?.count || 0, 10);
    }

    // Total Referral Commission Earned
    const commissionSum = await queryOne<{ total: any }>(`
      SELECT SUM(amount) as total FROM referral_commissions WHERE referrer_id = ?
    `, [session.id]);

    const totalCommission = parseFloat(commissionSum?.total || 0);

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
