import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Please enter a promo gift code' }, { status: 400 });
    }

    const inputCode = code.trim().toUpperCase();

    const gift = await queryOne('SELECT * FROM gift_codes WHERE code = ?', [inputCode]) as any;
    if (!gift) {
      return NextResponse.json({ error: 'Invalid gift code' }, { status: 400 });
    }

    if (gift.times_used >= gift.max_uses) {
      return NextResponse.json({ error: 'This gift code has reached maximum redemptions' }, { status: 400 });
    }

    // Check if user already claimed this gift code
    const alreadyClaimed = await queryOne(
      'SELECT id FROM user_gift_claims WHERE user_id = ? AND gift_code_id = ?',
      [session.id, gift.id]
    );

    if (alreadyClaimed) {
      return NextResponse.json({ error: 'You have already redeemed this gift code!' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      // 1. Record gift claim
      await client.query(
        'INSERT INTO user_gift_claims (user_id, gift_code_id, claimed_amount) VALUES ($1, $2, $3)',
        [session.id, gift.id, gift.amount]
      );

      // 2. Increment gift code times_used
      await client.query('UPDATE gift_codes SET times_used = times_used + 1 WHERE id = $1', [gift.id]);

      // 3. Credit user balance
      await client.query(
        'UPDATE users SET balance = balance + $1, total_income = total_income + $2 WHERE id = $3',
        [gift.amount, gift.amount, session.id]
      );

      // 4. Record transaction
      await client.query(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES ($1, 'gift_code', $2, 'completed', 'Promo Gift Code', $3)
      `, [session.id, gift.amount, `Redeemed Gift Code: ${inputCode}`]);
    });

    return NextResponse.json({
      success: true,
      message: `Success! NPR ${gift.amount.toFixed(2)} credited to your wallet balance!`,
      amount: gift.amount
    });
  } catch (error: any) {
    console.error('Gift code error:', error);
    return NextResponse.json({ error: 'Failed to redeem gift code' }, { status: 500 });
  }
}
