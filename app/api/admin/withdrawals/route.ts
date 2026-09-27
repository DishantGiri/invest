import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute, withTransaction } from '@/lib/db';

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

    const body = await req.json();
    const { action, transactionId, adminNote, user_id, amount, payment_method, payment_details, status } = body;

    // CREATE MANUAL WITHDRAWAL
    if (action === 'create') {
      if (!user_id || !amount) {
        return NextResponse.json({ error: 'User ID and Amount are required' }, { status: 400 });
      }

      const withdrawAmt = Number(amount);
      const isApproved = status === 'approved' || status === 'completed';

      const txnId = await withTransaction(async (client) => {
        const res = await client.query(`
          INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details, admin_note)
          VALUES ($1, 'withdrawal', $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          user_id,
          withdrawAmt,
          status || 'approved',
          payment_method || 'Admin Manual Payout',
          payment_details || 'Manual Withdrawal processed by Admin',
          adminNote || 'Created by Admin'
        ]);

        if (isApproved) {
          await client.query(`
            UPDATE users
            SET balance = balance - $1, total_withdrawal = total_withdrawal + $2
            WHERE id = $3
          `, [withdrawAmt, withdrawAmt, user_id]);
        }

        return res.rows[0]?.id;
      });

      return NextResponse.json({ success: true, message: 'Manual withdrawal recorded successfully!', transactionId: txnId });
    }

    // EDIT WITHDRAWAL TRANSACTION
    if (action === 'edit' && transactionId) {
      const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'withdrawal'", [transactionId]) as any;
      if (!txn) {
        return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
      }

      await execute(`
        UPDATE transactions
        SET amount = ?, payment_method = ?, payment_details = ?, status = ?, admin_note = ?
        WHERE id = ?
      `, [
        Number(amount !== undefined ? amount : txn.amount),
        payment_method || txn.payment_method,
        payment_details || txn.payment_details,
        status || txn.status,
        adminNote || txn.admin_note,
        transactionId
      ]);

      return NextResponse.json({ success: true, message: 'Withdrawal transaction updated!' });
    }

    // APPROVE OR REJECT PENDING WITHDRAWAL
    const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'withdrawal'", [transactionId]) as any;
    if (!txn) {
      return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'pending' && action !== 'approve_override') {
      return NextResponse.json({ error: `Transaction is already ${txn.status}` }, { status: 400 });
    }

    if (action === 'approve' || action === 'approve_override') {
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

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await execute("DELETE FROM transactions WHERE id = ? AND type = 'withdrawal'", [id]);

    return NextResponse.json({ success: true, message: 'Withdrawal record deleted!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete withdrawal transaction' }, { status: 500 });
  }
}
