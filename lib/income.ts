import { query, withTransaction } from './db';

export interface UserInvestment {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  invest_price: number;
  daily_income: number;
  total_expected: number;
  total_claimed: number;
  duration_days: number;
  days_passed: number;
  last_claim_at: string;
  status: 'active' | 'completed';
  created_at: string;
}

export function calculateClaimableIncome(investment: UserInvestment) {
  if (investment.status === 'completed' || investment.days_passed >= investment.duration_days) {
    return { claimableDays: 0, claimableAmount: 0, nextClaimInSeconds: 0 };
  }

  const lastClaimTime = new Date(investment.last_claim_at).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - lastClaimTime);
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Calculate elapsed days since last claim
  const elapsedDays = Math.floor(diffMs / oneDayMs);
  const remainingDays = investment.duration_days - investment.days_passed;
  const claimableDays = Math.min(elapsedDays, remainingDays);

  const claimableAmount = claimableDays * investment.daily_income;

  // Time remaining until next daily payout trigger
  const msInCurrentCycle = diffMs % oneDayMs;
  const nextClaimInSeconds = Math.max(0, Math.ceil((oneDayMs - msInCurrentCycle) / 1000));

  return {
    claimableDays,
    claimableAmount,
    nextClaimInSeconds,
    hoursPassedInCycle: (diffMs / (1000 * 60 * 60)).toFixed(1)
  };
}

export async function claimInvestmentProfits(userId: number, investmentId?: number) {
  const sql = investmentId
    ? "SELECT * FROM user_investments WHERE user_id = ? AND id = ? AND status = 'active'"
    : "SELECT * FROM user_investments WHERE user_id = ? AND status = 'active'";
  const params = investmentId ? [userId, investmentId] : [userId];

  const investments = await query<UserInvestment>(sql, params);
  let totalClaimedNow = 0;
  let totalDaysClaimed = 0;

  const nowIso = new Date().toISOString();

  await withTransaction(async (client) => {
    for (const inv of investments) {
      const { claimableDays, claimableAmount } = calculateClaimableIncome(inv);

      if (claimableDays > 0 && claimableAmount > 0) {
        const newDaysPassed = inv.days_passed + claimableDays;
        const newTotalClaimed = inv.total_claimed + claimableAmount;
        const newStatus = newDaysPassed >= inv.duration_days ? 'completed' : 'active';

        // Update investment record
        await client.query(
          `UPDATE user_investments
           SET total_claimed = $1, days_passed = $2, last_claim_at = $3, status = $4
           WHERE id = $5`,
          [newTotalClaimed, newDaysPassed, nowIso, newStatus, inv.id]
        );

        totalClaimedNow += claimableAmount;
        totalDaysClaimed += claimableDays;

        // Record transaction
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
           VALUES ($1, 'daily_income', $2, 'completed', 'Auto Claim Engine', $3)`,
          [userId, claimableAmount, `Daily income for ${inv.plan_name} (${claimableDays} days)`]
        );
      }
    }

    if (totalClaimedNow > 0) {
      // Update User Balance & Total Income
      await client.query(
        `UPDATE users
         SET balance = balance + $1, total_income = total_income + $2
         WHERE id = $3`,
        [totalClaimedNow, totalClaimedNow, userId]
      );
    }
  });

  return {
    totalClaimedNow,
    totalDaysClaimed
  };
}
