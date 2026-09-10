import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { claimInvestmentProfits } from '@/lib/income';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const investmentId = body.investmentId ? Number(body.investmentId) : undefined;

    const result = await claimInvestmentProfits(session.id, investmentId);

    if (result.totalClaimedNow <= 0) {
      return NextResponse.json({
        success: false,
        message: 'No profits ready to claim yet. Profits accrue every 24 hours!'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed NPR ${result.totalClaimedNow.toFixed(2)} from ${result.totalDaysClaimed} days of investment ROI!`,
      claimedAmount: result.totalClaimedNow
    });
  } catch (error: any) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Failed to claim profits' }, { status: 500 });
  }
}
