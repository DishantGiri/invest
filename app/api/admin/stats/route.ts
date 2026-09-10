import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin authorization required.' }, { status: 403 });
    }

    const uRes = await queryOne<{ count: any }>("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const totalUsers = parseInt(uRes?.count || 0, 10);

    const ubRes = await queryOne<{ total: any }>("SELECT SUM(balance) as total FROM users WHERE role = 'user'");
    const totalUserBalance = parseFloat(ubRes?.total || 0);

    const invRes = await queryOne<{ count: any }>("SELECT COUNT(*) as count FROM user_investments");
    const totalInvestmentsCount = parseInt(invRes?.count || 0, 10);

    const invAmtRes = await queryOne<{ total: any }>("SELECT SUM(invest_price) as total FROM user_investments");
    const totalInvestedAmount = parseFloat(invAmtRes?.total || 0);

    const prRes = await queryOne<{ count: any }>("SELECT COUNT(*) as count FROM transactions WHERE type = 'recharge' AND status = 'pending'");
    const pendingRechargesCount = parseInt(prRes?.count || 0, 10);

    const prAmtRes = await queryOne<{ total: any }>("SELECT SUM(amount) as total FROM transactions WHERE type = 'recharge' AND status = 'pending'");
    const pendingRechargesAmount = parseFloat(prAmtRes?.total || 0);

    const pwRes = await queryOne<{ count: any }>("SELECT COUNT(*) as count FROM transactions WHERE type = 'withdrawal' AND status = 'pending'");
    const pendingWithdrawalsCount = parseInt(pwRes?.count || 0, 10);

    const pwAmtRes = await queryOne<{ total: any }>("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdrawal' AND status = 'pending'");
    const pendingWithdrawalsAmount = parseFloat(pwAmtRes?.total || 0);

    const arAmtRes = await queryOne<{ total: any }>("SELECT SUM(amount) as total FROM transactions WHERE type = 'recharge' AND status = 'approved'");
    const approvedRechargesAmount = parseFloat(arAmtRes?.total || 0);

    const awAmtRes = await queryOne<{ total: any }>("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdrawal' AND status = 'approved'");
    const approvedWithdrawalsAmount = parseFloat(awAmtRes?.total || 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalUserBalance,
        totalInvestmentsCount,
        totalInvestedAmount,
        pendingRechargesCount,
        pendingRechargesAmount,
        pendingWithdrawalsCount,
        pendingWithdrawalsAmount,
        approvedRechargesAmount,
        approvedWithdrawalsAmount
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to load admin stats' }, { status: 500 });
  }
}
