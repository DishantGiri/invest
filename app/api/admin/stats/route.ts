import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin authorization required.' }, { status: 403 });
    }

    const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any)?.count || 0;
    const totalUserBalance = (db.prepare("SELECT SUM(balance) as total FROM users WHERE role = 'user'").get() as any)?.total || 0;

    const totalInvestmentsCount = (db.prepare("SELECT COUNT(*) as count FROM user_investments").get() as any)?.count || 0;
    const totalInvestedAmount = (db.prepare("SELECT SUM(invest_price) as total FROM user_investments").get() as any)?.total || 0;

    const pendingRechargesCount = (db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'recharge' AND status = 'pending'").get() as any)?.count || 0;
    const pendingRechargesAmount = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'recharge' AND status = 'pending'").get() as any)?.total || 0;

    const pendingWithdrawalsCount = (db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'withdrawal' AND status = 'pending'").get() as any)?.count || 0;
    const pendingWithdrawalsAmount = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdrawal' AND status = 'pending'").get() as any)?.total || 0;

    const approvedRechargesAmount = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'recharge' AND status = 'approved'").get() as any)?.total || 0;
    const approvedWithdrawalsAmount = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdrawal' AND status = 'approved'").get() as any)?.total || 0;

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
