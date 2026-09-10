import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { calculateClaimableIncome, UserInvestment } from '@/lib/income';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const investments = await query<UserInvestment>('SELECT * FROM user_investments WHERE user_id = ? ORDER BY id DESC', [session.id]);

    let totalActiveInvestmentValue = 0;
    let totalClaimableAmount = 0;

    const enrichedInvestments = investments.map(inv => {
      if (inv.status === 'active') {
        totalActiveInvestmentValue += Number(inv.invest_price);
      }

      const claimStats = calculateClaimableIncome(inv);
      totalClaimableAmount += claimStats.claimableAmount;

      return {
        ...inv,
        claimStats
      };
    });

    return NextResponse.json({
      success: true,
      investments: enrichedInvestments,
      summary: {
        totalActiveInvestmentValue,
        totalClaimableAmount,
        activeCount: enrichedInvestments.filter(i => i.status === 'active').length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch user investments' }, { status: 500 });
  }
}
