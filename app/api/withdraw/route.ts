import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, withTransaction } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = await query(`
      SELECT * FROM transactions
      WHERE user_id = ? AND type = 'withdrawal'
      ORDER BY id DESC
    `, [session.id]);

    return NextResponse.json({ success: true, withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch withdrawal history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bank_name, account_name, account_number } = await req.json();

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is NPR 100' }, { status: 400 });
    }

    if (!bank_name || !account_name || !account_number) {
      return NextResponse.json({ error: 'Please provide Bank Name, Account Holder Name, and Account Number' }, { status: 400 });
    }

    // Get fresh user balance
    const user = await queryOne('SELECT balance FROM users WHERE id = ?', [session.id]) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json({
        error: `Insufficient balance! Wallet balance is NPR ${user.balance.toFixed(2)}, requested NPR ${withdrawAmount.toFixed(2)}.`
      }, { status: 400 });
    }

    const detailsStr = `${bank_name.trim()} - A/C: ${account_number.trim()} (${account_name.trim()})`;

    const transactionId = await withTransaction(async (client) => {
      // 1. Deduct balance from user wallet immediately (pending review)
      await client.query(
        'UPDATE users SET balance = balance - $1, bank_name = $2, account_name = $3, account_number = $4 WHERE id = $5',
        [withdrawAmount, bank_name.trim(), account_name.trim(), account_number.trim(), session.id]
      );

      // 2. Create pending withdrawal transaction
      const res = await client.query(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES ($1, 'withdrawal', $2, 'pending', $3, $4)
        RETURNING id
      `, [session.id, withdrawAmount, bank_name.trim(), detailsStr]);

      return res.rows[0]?.id;
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request of NPR ${withdrawAmount.toFixed(2)} submitted successfully! It will be reviewed by admin shortly.`,
      transactionId
    });
  } catch (error: any) {
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal request' }, { status: 500 });
  }
}
