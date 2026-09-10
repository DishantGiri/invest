import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute, withTransaction } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const recharges = await query(`
      SELECT t.*, u.phone_or_email, u.full_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'recharge'
      ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC
    `);

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

    const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'recharge'", [transactionId]) as any;
    if (!txn) {
      return NextResponse.json({ error: 'Recharge transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'pending') {
      return NextResponse.json({ error: `Transaction is already ${txn.status}` }, { status: 400 });
    }

    if (action === 'approve') {
      await withTransaction(async (client) => {
        await client.query(`
          UPDATE transactions
          SET status = 'approved', admin_note = $1
          WHERE id = $2
        `, [adminNote || 'Approved by Admin', transactionId]);

        await client.query(`
          UPDATE users
          SET balance = balance + $1, total_recharge = total_recharge + $2
          WHERE id = $3
        `, [txn.amount, txn.amount, txn.user_id]);
      });

      return NextResponse.json({ success: true, message: `Recharge of NPR ${txn.amount} approved and credited to user balance!` });
    } else if (action === 'reject') {
      await execute(`
        UPDATE transactions
        SET status = 'rejected', admin_note = ?
        WHERE id = ?
      `, [adminNote || 'Rejected by Admin', transactionId]);

      return NextResponse.json({ success: true, message: 'Recharge request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Recharge Action Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
