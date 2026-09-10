import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { queryOne } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'catl_investment_super_secret_key_2026_nxt'
);

export interface UserSession {
  id: number;
  phone_or_email: string;
  full_name: string;
  role: 'user' | 'admin';
  referral_code: string;
}

export async function createToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('catl_auth_token')?.value;

  if (!token) return null;
  return await verifyToken(token);
}

export async function getFullUserData(userId: number) {
  const user = await queryOne(`
    SELECT id, phone_or_email, full_name, role, referral_code, referred_by,
           balance, total_income, total_recharge, total_withdrawal,
           bank_name, account_name, account_number, created_at
    FROM users WHERE id = ?
  `, [userId]);
  return user as any;
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CATL';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
