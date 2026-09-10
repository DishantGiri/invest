import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import pg from 'pg';

// Parse NUMERIC (1700) and BIGINT (20) as numbers
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/catl_invest';

const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('supabase.com');

const pool = new Pool({
  connectionString,
  ssl: isSupabase || (process.env.NODE_ENV === 'production' && !connectionString.includes('localhost'))
    ? { rejectUnauthorized: false }
    : false
});

/**
 * Helper to convert SQLite style ? placeholders to PostgreSQL $1, $2, ...
 */
export function convertPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Execute a query returning all matching rows
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  await initDb();
  const pgSql = convertPlaceholders(sql);
  const res = await pool.query(pgSql, params);
  return res.rows as T[];
}

/**
 * Execute a query returning the first matching row or null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 */
export async function execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
  await initDb();
  const pgSql = convertPlaceholders(sql);
  const res = await pool.query(pgSql, params);
  return { rowCount: res.rowCount || 0 };
}

/**
 * Execute operations within a database transaction
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_or_email TEXT UNIQUE NOT NULL,
        full_name TEXT DEFAULT '',
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        referral_code TEXT UNIQUE NOT NULL,
        referred_by TEXT DEFAULT NULL,
        balance DOUBLE PRECISION DEFAULT 0.00,
        total_income DOUBLE PRECISION DEFAULT 0.00,
        total_recharge DOUBLE PRECISION DEFAULT 0.00,
        total_withdrawal DOUBLE PRECISION DEFAULT 0.00,
        bank_name TEXT DEFAULT '',
        account_name TEXT DEFAULT '',
        account_number TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // System Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Investment Plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        daily_income DOUBLE PRECISION NOT NULL,
        total_revenue DOUBLE PRECISION NOT NULL,
        duration_days INTEGER NOT NULL,
        vip_level INTEGER DEFAULT 1,
        badge_text TEXT DEFAULT 'VIP 1',
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Investments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES investment_plans(id),
        plan_name TEXT NOT NULL,
        invest_price DOUBLE PRECISION NOT NULL,
        daily_income DOUBLE PRECISION NOT NULL,
        total_expected DOUBLE PRECISION NOT NULL,
        total_claimed DOUBLE PRECISION DEFAULT 0.00,
        duration_days INTEGER NOT NULL,
        days_passed INTEGER DEFAULT 0,
        last_claim_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        status TEXT DEFAULT 'completed',
        payment_method TEXT DEFAULT '',
        payment_details TEXT DEFAULT '',
        admin_note TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Referral Commissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_commissions (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id),
        referee_id INTEGER NOT NULL REFERENCES users(id),
        tier INTEGER DEFAULT 1,
        amount DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Gift Codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        max_uses INTEGER DEFAULT 100,
        times_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Gift Claims table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_gift_claims (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        gift_code_id INTEGER NOT NULL REFERENCES gift_codes(id),
        claimed_amount DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Default System Settings
    const defaultSettings: Record<string, string> = {
      tier1_referral_percent: '10',
      tier2_referral_percent: '3',
      esewa_account_name: 'CATL Energy Nepal Pvt Ltd',
      esewa_account_number: '9841234567',
      esewa_qr_image: '/payment_qr.png',
      khalti_account_name: 'CATL Clean Power Ltd',
      khalti_account_number: '9801234567',
      khalti_qr_image: '/payment_qr.png',
      bank_account_name: 'Contemporary Amperex Tech Ltd',
      bank_account_number: '001001500998877 (Global IME Bank)',
      bank_qr_image: '/payment_qr.png',
      usdt_address: 'TRX79841234567890abcdef1234567890 (TRC20)',
      usdt_qr_image: '/payment_qr.png',
      logo_image: '/catl_logo.png'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await pool.query(
        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [key, value]
      );
    }

    // Seed default Admin Account if not existing
    const adminRes = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (adminRes.rowCount === 0) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      await pool.query(
        `INSERT INTO users (phone_or_email, full_name, password_hash, role, referral_code, balance)
         VALUES ($1, $2, $3, 'admin', 'CATLADMIN', 50000.00)
         ON CONFLICT (phone_or_email) DO NOTHING`,
        ['admin@catl.com', 'CATL System Admin', adminPasswordHash]
      );
    }

    // Seed initial CATL investment plans if table is empty
    const planCountRes = await pool.query('SELECT COUNT(*) as count FROM investment_plans');
    const planCount = parseInt(planCountRes.rows[0].count, 10);
    if (planCount === 0) {
      const defaultPlans = [
        { name: 'CATL XSUS-1 Energy Cell', price: 1100.00, daily_income: 380.00, total_revenue: 57000.00, duration_days: 150, vip_level: 1, badge_text: 'VIP 1' },
        { name: 'CATL XSUS-2 Storage Station', price: 2500.00, daily_income: 700.00, total_revenue: 105000.00, duration_days: 150, vip_level: 2, badge_text: 'VIP 2' },
        { name: 'CATL XSUS-3 Super Grid', price: 5000.00, daily_income: 1500.00, total_revenue: 225000.00, duration_days: 150, vip_level: 3, badge_text: 'VIP 3' },
        { name: 'CATL XSUS-4 Battery Giga Matrix', price: 12000.00, daily_income: 3800.00, total_revenue: 570000.00, duration_days: 150, vip_level: 4, badge_text: 'VIP 4' },
        { name: 'CATL Mega Power Plant', price: 28000.00, daily_income: 9500.00, total_revenue: 1425000.00, duration_days: 150, vip_level: 5, badge_text: 'VIP 5' }
      ];

      for (const p of defaultPlans) {
        await pool.query(
          `INSERT INTO investment_plans (name, price, daily_income, total_revenue, duration_days, vip_level, badge_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [p.name, p.price, p.daily_income, p.total_revenue, p.duration_days, p.vip_level, p.badge_text]
        );
      }
    }

    // Seed sample gift code
    const giftCountRes = await pool.query('SELECT COUNT(*) as count FROM gift_codes');
    const giftCount = parseInt(giftCountRes.rows[0].count, 10);
    if (giftCount === 0) {
      await pool.query(
        `INSERT INTO gift_codes (code, amount, max_uses)
         VALUES ('CATL2026', 150.00, 500)
         ON CONFLICT (code) DO NOTHING`
      );
    }

    isInitialized = true;
  } catch (err) {
    console.error('PostgreSQL DB Init Error:', err);
  }
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  await initDb();
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM system_settings');
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  await initDb();
  await pool.query(
    'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [key, value]
  );
}

export default pool;
