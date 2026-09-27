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

    const body = await req.json();
    const { action, transactionId, adminNote, user_id, amount, payment_method, payment_details, status } = body;

    // CREATE MANUAL DEPOSIT
    if (action === 'create') {
      if (!user_id || !amount) {
        return NextResponse.json({ error: 'User ID and Amount are required' }, { status: 400 });
      }

      const depositAmt = Number(amount);
      const isApproved = status === 'approved' || status === 'completed';

      const txnId = await withTransaction(async (client) => {
        const res = await client.query(`
          INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details, admin_note)
          VALUES ($1, 'recharge', $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          user_id,
          depositAmt,
          status || 'approved',
          payment_method || 'Admin Direct Deposit',
          payment_details || 'Manual Deposit added by Admin',
          adminNote || 'Created by Admin'
        ]);

        if (isApproved) {
          await client.query(`
            UPDATE users
            SET balance = balance + $1, total_recharge = total_recharge + $2
            WHERE id = $3
          `, [depositAmt, depositAmt, user_id]);
        }

        return res.rows[0]?.id;
      });

      return NextResponse.json({ success: true, message: 'Manual deposit recorded successfully!', transactionId: txnId });
    }

    // EDIT DEPOSIT TRANSACTION
    if (action === 'edit' && transactionId) {
      const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'recharge'", [transactionId]) as any;
      if (!txn) {
        return NextResponse.json({ error: 'Recharge transaction not found' }, { status: 404 });
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

      return NextResponse.json({ success: true, message: 'Deposit transaction updated!' });
    }

    // APPROVE OR REJECT PENDING DEPOSIT
    const txn = await queryOne("SELECT * FROM transactions WHERE id = ? AND type = 'recharge'", [transactionId]) as any;
    if (!txn) {
      return NextResponse.json({ error: 'Recharge transaction not found' }, { status: 404 });
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

    await execute("DELETE FROM transactions WHERE id = ? AND type = 'recharge'", [id]);

    return NextResponse.json({ success: true, message: 'Recharge record deleted!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete recharge transaction' }, { status: 500 });
  }
}
