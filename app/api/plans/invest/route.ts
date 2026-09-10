import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { queryOne, getSystemSettings, withTransaction } from '@/lib/db';

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
    const settings = await getSystemSettings();
    const tier1Percent = (Number(settings.tier1_referral_percent) || 10) / 100;
    const tier2Percent = (Number(settings.tier2_referral_percent) || 3) / 100;

    // Get Plan details
    const plan = await queryOne('SELECT * FROM investment_plans WHERE id = ? AND status = 1', [plan_id]) as any;
    if (!plan) {
      return NextResponse.json({ error: 'Investment plan not found or inactive' }, { status: 404 });
    }

    // Get User details
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [session.id]) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.balance < plan.price) {
      return NextResponse.json({
        error: `Insufficient wallet balance! Balance: NPR ${user.balance.toFixed(2)}, Plan Price: NPR ${plan.price.toFixed(2)}. Please recharge your wallet.`
      }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    const investmentId = await withTransaction(async (client) => {
      // 1. Deduct user balance
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [plan.price, user.id]);

      // 2. Create User Investment record
      const invRes = await client.query(`
        INSERT INTO user_investments (
          user_id, plan_id, plan_name, invest_price, daily_income, total_expected,
          duration_days, days_passed, last_claim_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'active')
        RETURNING id
      `, [
        user.id,
        plan.id,
        plan.name,
        plan.price,
        plan.daily_income,
        plan.total_revenue,
        plan.duration_days,
        nowIso
      ]);

      const newInvId = invRes.rows[0]?.id;

      // 3. Record investment purchase transaction
      await client.query(`
        INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
        VALUES ($1, 'investment_purchase', $2, 'completed', 'Wallet Balance', $3)
      `, [user.id, plan.price, `Subscribed to ${plan.name}`]);

      // 4. Distribute Dynamic Referral Commissions
      if (user.referred_by) {
        // Tier 1 Referrer
        const t1Res = await client.query('SELECT * FROM users WHERE referral_code = $1', [user.referred_by]);
        const tier1Referrer = t1Res.rows[0];

        if (tier1Referrer) {
          const t1Commission = plan.price * tier1Percent;
          await client.query(
            'UPDATE users SET balance = balance + $1, total_income = total_income + $2 WHERE id = $3',
            [t1Commission, t1Commission, tier1Referrer.id]
          );

          await client.query(`
            INSERT INTO referral_commissions (referrer_id, referee_id, tier, amount)
            VALUES ($1, $2, 1, $3)
          `, [tier1Referrer.id, user.id, t1Commission]);

          await client.query(`
            INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
            VALUES ($1, 'referral_bonus', $2, 'completed', 'Tier 1 Referral', $3)
          `, [tier1Referrer.id, t1Commission, `${(tier1Percent * 100).toFixed(0)}% Commission from ${user.full_name || 'Team member'} investment in ${plan.name}`]);

          // Tier 2 Referrer
          if (tier1Referrer.referred_by) {
            const t2Res = await client.query('SELECT * FROM users WHERE referral_code = $1', [tier1Referrer.referred_by]);
            const tier2Referrer = t2Res.rows[0];

            if (tier2Referrer) {
              const t2Commission = plan.price * tier2Percent;
              await client.query(
                'UPDATE users SET balance = balance + $1, total_income = total_income + $2 WHERE id = $3',
                [t2Commission, t2Commission, tier2Referrer.id]
              );

              await client.query(`
                INSERT INTO referral_commissions (referrer_id, referee_id, tier, amount)
                VALUES ($1, $2, 2, $3)
              `, [tier2Referrer.id, user.id, t2Commission]);

              await client.query(`
                INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
                VALUES ($1, 'referral_bonus', $2, 'completed', 'Tier 2 Referral', $3)
              `, [tier2Referrer.id, t2Commission, `${(tier2Percent * 100).toFixed(0)}% Tier 2 Commission from ${user.full_name || 'Member'} investment in ${plan.name}`]);
            }
          }
        }
      }

      return newInvId;
    });

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
