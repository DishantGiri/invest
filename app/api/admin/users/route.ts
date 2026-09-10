import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await query(`
      SELECT id, phone_or_email, full_name, role, referral_code, referred_by,
             balance, total_income, total_recharge, total_withdrawal,
             bank_name, account_name, account_number, created_at
      FROM users
      ORDER BY id DESC
    `);

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { userId, newBalance, role } = await req.json();

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (newBalance !== undefined && !isNaN(Number(newBalance))) {
      await execute('UPDATE users SET balance = ? WHERE id = ?', [Number(newBalance), userId]);
    }

    if (role && (role === 'user' || role === 'admin')) {
      await execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
