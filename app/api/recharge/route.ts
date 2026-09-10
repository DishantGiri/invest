import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db, { getSystemSettings } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recharges = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ? AND type = 'recharge'
      ORDER BY id DESC
    `).all(session.id);

    const settings = getSystemSettings();

    return NextResponse.json({ success: true, recharges, settings });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch recharge data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, payment_method, transaction_ref, sender_info } = await req.json();

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid deposit amount' }, { status: 400 });
    }

    if (!payment_method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    const finalRef = (transaction_ref && transaction_ref.trim())
      ? transaction_ref.trim()
      : `DEP-${Math.floor(100000 + Math.random() * 900000)}`;

    let detailsStr = `Ref: ${finalRef}`;
    if (sender_info && sender_info.trim()) {
      detailsStr += ` | ${sender_info.trim()}`;
    }

    const result = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
      VALUES (?, 'recharge', ?, 'pending', ?, ?)
    `).run(session.id, depositAmount, payment_method, detailsStr);

    return NextResponse.json({
      success: true,
      message: 'Recharge request submitted successfully! Pending approval from CATL Admin.',
      transactionId: result.lastInsertRowid
    });
  } catch (error: any) {
    console.error('Recharge error:', error);
    return NextResponse.json({ error: 'Failed to submit recharge request' }, { status: 500 });
  }
}
