import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, withTransaction } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const withdrawals = await query(`
      SELECT t.*, u.phone_or_email, u.full_name, u.bank_name, u.account_name, u.account_number
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'withdrawal'
      ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC
    `);

    return NextResponse.json({ success: true, withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { transactionId, action, adminNote } = await req.json();

    const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'withdrawal'", [transactionId]) as any;
    if (!txn) {
      return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
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
        `, [adminNote || 'Payout approved and completed by Admin', transactionId]);

        await client.query(`
          UPDATE users
          SET total_withdrawal = total_withdrawal + $1
          WHERE id = $2
        `, [txn.amount, txn.user_id]);
      });

      return NextResponse.json({ success: true, message: `Withdrawal of NPR ${txn.amount} marked as APPROVED!` });
    } else if (action === 'reject') {
      await withTransaction(async (client) => {
        await client.query(`
          UPDATE transactions
          SET status = 'rejected', admin_note = $1
          WHERE id = $2
        `, [adminNote || 'Rejected by Admin', transactionId]);

        // Refund user balance
        await client.query(`
          UPDATE users
          SET balance = balance + $1
          WHERE id = $2
        `, [txn.amount, txn.user_id]);
      });

      return NextResponse.json({ success: true, message: `Withdrawal rejected and NPR ${txn.amount} refunded to user wallet.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Withdrawal Action Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
