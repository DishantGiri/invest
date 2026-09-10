import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const plans = await query("SELECT * FROM investment_plans ORDER BY id DESC");
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, name, price, daily_income, total_revenue, duration_days, vip_level, badge_text } = await req.json();

    if (!name || !price || !daily_income || !duration_days) {
      return NextResponse.json({ error: 'Name, Price, Daily Income, and Duration Days are required' }, { status: 400 });
    }

    const planPrice = Number(price);
    const planDailyIncome = Number(daily_income);
    const planDuration = Number(duration_days);
    const calculatedRevenue = total_revenue ? Number(total_revenue) : (planDailyIncome * planDuration);

    if (id) {
      // Edit existing plan
      await execute(`
        UPDATE investment_plans
        SET name = ?, price = ?, daily_income = ?, total_revenue = ?, duration_days = ?, vip_level = ?, badge_text = ?
        WHERE id = ?
      `, [
        name.trim(),
        planPrice,
        planDailyIncome,
        calculatedRevenue,
        planDuration,
        vip_level || 1,
        badge_text || `VIP ${vip_level || 1}`,
        id
      ]);

      return NextResponse.json({ success: true, message: 'Investment plan updated!' });
    } else {
      // Add new plan
      await execute(`
        INSERT INTO investment_plans (name, price, daily_income, total_revenue, duration_days, vip_level, badge_text, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        name.trim(),
        planPrice,
        planDailyIncome,
        calculatedRevenue,
        planDuration,
        vip_level || 1,
        badge_text || `VIP ${vip_level || 1}`
      ]);

      return NextResponse.json({ success: true, message: 'New CATL Investment plan created!' });
    }
  } catch (error: any) {
    console.error('Admin Plan Save Error:', error);
    return NextResponse.json({ error: 'Failed to save investment plan' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, status } = await req.json();

    await execute("UPDATE investment_plans SET status = ? WHERE id = ?", [status ? 1 : 0, id]);

    return NextResponse.json({ success: true, message: 'Plan status updated' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update plan status' }, { status: 500 });
  }
}
