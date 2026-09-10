import { NextResponse } from 'next/server';
import { getSessionUser, getFullUserData } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await getFullUserData(session.id);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active investment counts and metrics
    const activeRes = await queryOne<{ count: any }>(
      "SELECT COUNT(*) as count FROM user_investments WHERE user_id = ? AND status = 'active'",
      [session.id]
    );
    const activeInvestmentsCount = parseInt(activeRes?.count || 0, 10);

    const teamRes = await queryOne<{ count: any }>(
      "SELECT COUNT(*) as count FROM users WHERE referred_by = ?",
      [userData.referral_code]
    );
    const teamCount = parseInt(teamRes?.count || 0, 10);

    return NextResponse.json({
      success: true,
      user: {
        ...userData,
        activeInvestmentsCount,
        teamCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_name, account_name, account_number } = await req.json();

    if (!bank_name || !account_name || !account_number) {
      return NextResponse.json({ error: 'Bank Name, Account Name, and Account Number are required' }, { status: 400 });
    }

    await execute(`
      UPDATE users
      SET bank_name = ?, account_name = ?, account_number = ?
      WHERE id = ?
    `, [bank_name.trim(), account_name.trim(), account_number.trim(), session.id]);

    return NextResponse.json({ success: true, message: 'Bank details saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 });
  }
}
