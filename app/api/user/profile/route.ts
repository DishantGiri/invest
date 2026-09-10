import { NextResponse } from 'next/server';
import { getSessionUser, getFullUserData } from '@/lib/auth';
import db from '@/lib/db';

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
    const activeInvestmentsCount = (
      db.prepare("SELECT COUNT(*) as count FROM user_investments WHERE user_id = ? AND status = 'active'").get(session.id) as any
    )?.count || 0;

    const teamCount = (
      db.prepare("SELECT COUNT(*) as count FROM users WHERE referred_by = ?").get(userData.referral_code) as any
    )?.count || 0;

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

    db.prepare(`
      UPDATE users
      SET bank_name = ?, account_name = ?, account_number = ?
      WHERE id = ?
    `).run(bank_name.trim(), account_name.trim(), account_number.trim(), session.id);

    return NextResponse.json({ success: true, message: 'Bank details saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 });
  }
}
