import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db from '@/lib/db';

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

    const gift = db.prepare("SELECT * FROM gift_codes WHERE code = ?").get(inputCode) as any;
    if (!gift) {
      return NextResponse.json({ error: 'Invalid gift code' }, { status: 400 });
    }

    if (gift.times_used >= gift.max_uses) {
      return NextResponse.json({ error: 'This gift code has reached maximum redemptions' }, { status: 400 });
    }

    // Check if user already claimed this gift code
    const alreadyClaimed = db.prepare("SELECT id FROM user_gift_claims WHERE user_id = ? AND gift_code_id = ?")
      .get(session.id, gift.id);

    if (alreadyClaimed) {
      return NextResponse.json({ error: 'You have already redeemed this gift code!' }, { status: 400 });
    }

    const claimTx = db.transaction(() => {
      // 1. Record gift claim
      db.prepare("INSERT INTO user_gift_claims (user_id, gift_code_id, claimed_amount) VALUES (?, ?, ?)")
        .run(session.id, gift.id, gift.amount);

      // 2. Increment gift code times_used
      db.prepare("UPDATE gift_codes SET times_used = times_used + 1 WHERE id = ?").run(gift.id);

      // 3. Credit user balance
      db.prepare("UPDATE users SET balance = balance + ?, total_income = total_income + ? WHERE id = ?")
        .run(gift.amount, gift.amount, session.id);

      // 4. Record transaction
      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES (?, 'gift_code', ?, 'completed', 'Promo Gift Code', ?)
      `).run(session.id, gift.amount, `Redeemed Gift Code: ${inputCode}`);
    });

    claimTx();

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
