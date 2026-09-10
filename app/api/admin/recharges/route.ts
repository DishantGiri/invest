import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const recharges = db.prepare(`
      SELECT t.*, u.phone_or_email, u.full_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'recharge'
      ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC
    `).all();

    return NextResponse.json({ success: true, recharges });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch recharges' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { transactionId, action, adminNote } = await req.json();

    const txn = db.prepare("SELECT * FROM transactions WHERE id = ? AND type = 'recharge'").get(transactionId) as any;
    if (!txn) {
      return NextResponse.json({ error: 'Recharge transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'pending') {
      return NextResponse.json({ error: `Transaction is already ${txn.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      const approveTx = db.transaction(() => {
        db.prepare(`
          UPDATE transactions
          SET status = 'approved', admin_note = ?
          WHERE id = ?
        `).run(adminNote || 'Approved by Admin', transactionId);

        db.prepare(`
          UPDATE users
          SET balance = balance + ?, total_recharge = total_recharge + ?
          WHERE id = ?
        `).run(txn.amount, txn.amount, txn.user_id);
      });

      approveTx();

      return NextResponse.json({ success: true, message: `Recharge of NPR ${txn.amount} approved and credited to user balance!` });
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE transactions
        SET status = 'rejected', admin_note = ?
        WHERE id = ?
      `).run(adminNote || 'Rejected by Admin', transactionId);

      return NextResponse.json({ success: true, message: 'Recharge request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Recharge Action Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
