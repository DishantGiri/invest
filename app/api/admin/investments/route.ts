import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const investments = await query(`
      SELECT ui.*, u.phone_or_email, u.full_name
      FROM user_investments ui
      JOIN users u ON ui.user_id = u.id
      ORDER BY ui.id DESC
    `);

    return NextResponse.json({ success: true, investments });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { action, id } = body;

    if (action === 'create') {
      const { user_id, plan_id, plan_name, invest_price, daily_income, duration_days } = body;
      if (!user_id || !invest_price || !daily_income || !duration_days) {
        return NextResponse.json({ error: 'User ID, Invest Price, Daily Income, and Duration are required' }, { status: 400 });
      }

      const totalExpected = Number(daily_income) * Number(duration_days);

      const res = await queryOne(`
        INSERT INTO user_investments (user_id, plan_id, plan_name, invest_price, daily_income, total_expected, duration_days, days_passed, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')
        RETURNING id
      `, [
        user_id,
        plan_id || 0,
        plan_name || 'Custom Admin Plan',
        Number(invest_price),
        Number(daily_income),
        totalExpected,
        Number(duration_days)
      ]);

      return NextResponse.json({ success: true, message: 'User investment plan created!', id: res?.id });
    }

    if (!id) {
      return NextResponse.json({ error: 'Investment ID is required for edit' }, { status: 400 });
    }

    const { status, days_passed, total_claimed } = body;

    if (status) {
      await execute('UPDATE user_investments SET status = ? WHERE id = ?', [status, id]);
    }

    if (days_passed !== undefined && !isNaN(Number(days_passed))) {
      await execute('UPDATE user_investments SET days_passed = ? WHERE id = ?', [Number(days_passed), id]);
    }

    if (total_claimed !== undefined && !isNaN(Number(total_claimed))) {
      await execute('UPDATE user_investments SET total_claimed = ? WHERE id = ?', [Number(total_claimed), id]);
    }

    return NextResponse.json({ success: true, message: 'Investment updated successfully' });
  } catch (error: any) {
    console.error('Admin Edit Investment Error:', error);
    return NextResponse.json({ error: 'Failed to save investment' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const investmentId = searchParams.get('id');

    if (!investmentId) {
      return NextResponse.json({ error: 'Investment ID is required' }, { status: 400 });
    }

    await execute('DELETE FROM user_investments WHERE id = ?', [investmentId]);

    return NextResponse.json({ success: true, message: 'Investment record deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
  }
}
