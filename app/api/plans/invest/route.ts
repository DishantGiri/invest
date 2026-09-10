import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import db, { getSystemSettings } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Please login to invest' }, { status: 401 });
    }

    const { plan_id } = await req.json();
    if (!plan_id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Fetch dynamic referral commission percentages from admin settings
    const settings = getSystemSettings();
    const tier1Percent = (Number(settings.tier1_referral_percent) || 10) / 100;
    const tier2Percent = (Number(settings.tier2_referral_percent) || 3) / 100;

    // Get Plan details
    const plan = db.prepare("SELECT * FROM investment_plans WHERE id = ? AND status = 1").get(plan_id) as any;
    if (!plan) {
      return NextResponse.json({ error: 'Investment plan not found or inactive' }, { status: 404 });
    }

    // Get User details
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.balance < plan.price) {
      return NextResponse.json({
        error: `Insufficient wallet balance! Balance: NPR ${user.balance.toFixed(2)}, Plan Price: NPR ${plan.price.toFixed(2)}. Please recharge your wallet.`
      }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    const buyTx = db.transaction(() => {
      // 1. Deduct user balance
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(plan.price, user.id);

      // 2. Create User Investment record
      const invResult = db.prepare(`
        INSERT INTO user_investments (
          user_id, plan_id, plan_name, invest_price, daily_income, total_expected,
          duration_days, days_passed, last_claim_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')
      `).run(
        user.id,
        plan.id,
        plan.name,
        plan.price,
        plan.daily_income,
        plan.total_revenue,
        plan.duration_days,
        nowIso
      );

      // 3. Record investment purchase transaction
      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES (?, 'investment_purchase', ?, 'completed', 'Wallet Balance', ?)
      `).run(user.id, plan.price, `Subscribed to ${plan.name}`);

      // 4. Distribute Dynamic Referral Commissions
      if (user.referred_by) {
        // Tier 1 Referrer
        const tier1Referrer = db.prepare("SELECT * FROM users WHERE referral_code = ?").get(user.referred_by) as any;
        if (tier1Referrer) {
          const t1Commission = plan.price * tier1Percent;
          db.prepare("UPDATE users SET balance = balance + ?, total_income = total_income + ? WHERE id = ?")
            .run(t1Commission, t1Commission, tier1Referrer.id);

          db.prepare(`
            INSERT INTO referral_commissions (referrer_id, referee_id, tier, amount)
            VALUES (?, ?, 1, ?)
          `).run(tier1Referrer.id, user.id, t1Commission);

          db.prepare(`
            INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
            VALUES (?, 'referral_bonus', ?, 'completed', 'Tier 1 Referral', ?)
          `).run(tier1Referrer.id, t1Commission, `${(tier1Percent * 100).toFixed(0)}% Commission from ${user.full_name || 'Team member'} investment in ${plan.name}`);

          // Tier 2 Referrer
          if (tier1Referrer.referred_by) {
            const tier2Referrer = db.prepare("SELECT * FROM users WHERE referral_code = ?").get(tier1Referrer.referred_by) as any;
            if (tier2Referrer) {
              const t2Commission = plan.price * tier2Percent;
              db.prepare("UPDATE users SET balance = balance + ?, total_income = total_income + ? WHERE id = ?")
                .run(t2Commission, t2Commission, tier2Referrer.id);

              db.prepare(`
                INSERT INTO referral_commissions (referrer_id, referee_id, tier, amount)
                VALUES (?, ?, 2, ?)
              `).run(tier2Referrer.id, user.id, t2Commission);

              db.prepare(`
                INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
                VALUES (?, 'referral_bonus', ?, 'completed', 'Tier 2 Referral', ?)
              `).run(tier2Referrer.id, t2Commission, `${(tier2Percent * 100).toFixed(0)}% Tier 2 Commission from ${user.full_name || 'Member'} investment in ${plan.name}`);
            }
          }
        }
      }

      return invResult.lastInsertRowid;
    });

    const investmentId = buyTx();

    return NextResponse.json({
      success: true,
      message: `Successfully invested in ${plan.name}! Daily income of NPR ${plan.daily_income} activated.`,
      investmentId
    });
  } catch (error: any) {
    console.error('Invest Error:', error);
    return NextResponse.json({ error: error.message || 'Investment failed' }, { status: 500 });
  }
}
