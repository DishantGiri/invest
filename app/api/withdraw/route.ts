import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ? AND type = 'withdrawal'
      ORDER BY id DESC
    `).all(session.id);

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
    const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(session.id) as any;

    if (user.balance < withdrawAmount) {
      return NextResponse.json({
        error: `Insufficient balance! Wallet balance is NPR ${user.balance.toFixed(2)}, requested NPR ${withdrawAmount.toFixed(2)}.`
      }, { status: 400 });
    }

    const detailsStr = `${bank_name.trim()} - A/C: ${account_number.trim()} (${account_name.trim()})`;

    const withdrawTx = db.transaction(() => {
      // 1. Deduct balance from user wallet immediately (pending review)
      db.prepare("UPDATE users SET balance = balance - ?, bank_name = ?, account_name = ?, account_number = ? WHERE id = ?")
        .run(withdrawAmount, bank_name.trim(), account_name.trim(), account_number.trim(), session.id);

      // 2. Create pending withdrawal transaction
      const result = db.prepare(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES (?, 'withdrawal', ?, 'pending', ?, ?)
      `).run(session.id, withdrawAmount, bank_name.trim(), detailsStr);

      return result.lastInsertRowid;
    });

    const transactionId = withdrawTx();

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
