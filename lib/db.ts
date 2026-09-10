import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'catl_invest.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_or_email TEXT UNIQUE NOT NULL,
      full_name TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT DEFAULT NULL,
      balance REAL DEFAULT 0.00,
      total_income REAL DEFAULT 0.00,
      total_recharge REAL DEFAULT 0.00,
      total_withdrawal REAL DEFAULT 0.00,
      bank_name TEXT DEFAULT '',
      account_name TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // System Settings table for Admin control
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Investment Plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      daily_income REAL NOT NULL,
      total_revenue REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      vip_level INTEGER DEFAULT 1,
      badge_text TEXT DEFAULT 'VIP 1',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User Investments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      invest_price REAL NOT NULL,
      daily_income REAL NOT NULL,
      total_expected REAL NOT NULL,
      total_claimed REAL DEFAULT 0.00,
      duration_days INTEGER NOT NULL,
      days_passed INTEGER DEFAULT 0,
      last_claim_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(plan_id) REFERENCES investment_plans(id)
    );
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      payment_method TEXT DEFAULT '',
      payment_details TEXT DEFAULT '',
      admin_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Referral Commissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referral_commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referee_id INTEGER NOT NULL,
      tier INTEGER DEFAULT 1,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(referrer_id) REFERENCES users(id),
      FOREIGN KEY(referee_id) REFERENCES users(id)
    );
  `);

  // Gift Codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      max_uses INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User Gift Claims table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_gift_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      gift_code_id INTEGER NOT NULL,
      claimed_amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(gift_code_id) REFERENCES gift_codes(id)
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

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // Seed default Admin Account if not existing
  const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (phone_or_email, full_name, password_hash, role, referral_code, balance)
      VALUES (?, ?, ?, 'admin', 'CATLADMIN', 50000.00)
    `).run('admin@catl.com', 'CATL System Admin', adminPasswordHash);
  }

  // Seed initial CATL investment plans if table is empty
  const planCount = (db.prepare("SELECT COUNT(*) as count FROM investment_plans").get() as { count: number }).count;
  if (planCount === 0) {
    const defaultPlans = [
      {
        name: 'CATL XSUS-1 Energy Cell',
        price: 1100.00,
        daily_income: 380.00,
        total_revenue: 57000.00,
        duration_days: 150,
        vip_level: 1,
        badge_text: 'VIP 1'
      },
      {
        name: 'CATL XSUS-2 Storage Station',
        price: 2500.00,
        daily_income: 700.00,
        total_revenue: 105000.00,
        duration_days: 150,
        vip_level: 2,
        badge_text: 'VIP 2'
      },
      {
        name: 'CATL XSUS-3 Super Grid',
        price: 5000.00,
        daily_income: 1500.00,
        total_revenue: 225000.00,
        duration_days: 150,
        vip_level: 3,
        badge_text: 'VIP 3'
      },
      {
        name: 'CATL XSUS-4 Battery Giga Matrix',
        price: 12000.00,
        daily_income: 3800.00,
        total_revenue: 570000.00,
        duration_days: 150,
        vip_level: 4,
        badge_text: 'VIP 4'
      },
      {
        name: 'CATL Mega Power Plant',
        price: 28000.00,
        daily_income: 9500.00,
        total_revenue: 1425000.00,
        duration_days: 150,
        vip_level: 5,
        badge_text: 'VIP 5'
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO investment_plans (name, price, daily_income, total_revenue, duration_days, vip_level, badge_text)
      VALUES (@name, @price, @daily_income, @total_revenue, @duration_days, @vip_level, @badge_text)
    `);

    for (const plan of defaultPlans) {
      insertStmt.run(plan);
    }
  }

  // Seed sample gift code
  const giftCount = (db.prepare("SELECT COUNT(*) as count FROM gift_codes").get() as { count: number }).count;
  if (giftCount === 0) {
    db.prepare(`
      INSERT INTO gift_codes (code, amount, max_uses)
      VALUES ('CATL2026', 150.00, 500)
    `).run();
  }
}

// Auto-run initDb on load
initDb();

export function getSystemSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM system_settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

export function updateSystemSetting(key: string, value: string) {
  db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)").run(key, value);
}

export default db;
