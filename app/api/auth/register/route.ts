import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createToken, generateReferralCode } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone_or_email, full_name, password, referral_code } = await req.json();

    if (!phone_or_email || !password) {
      return NextResponse.json({ error: 'Mobile / Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedInput = phone_or_email.trim().toLowerCase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE phone_or_email = ?').get(normalizedInput);
    if (existing) {
      return NextResponse.json({ error: 'Account already registered with this Phone / Email' }, { status: 400 });
    }

    // Verify referrer if provided
    let inviterCode: string | null = null;
    if (referral_code && referral_code.trim()) {
      const inviter = db.prepare('SELECT referral_code FROM users WHERE referral_code = ?').get(referral_code.trim().toUpperCase()) as any;
      if (inviter) {
        inviterCode = inviter.referral_code;
      }
    }

    // Generate unique referral code
    let newRefCode = generateReferralCode();
    while (db.prepare('SELECT id FROM users WHERE referral_code = ?').get(newRefCode)) {
      newRefCode = generateReferralCode();
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const welcomeBonus = 50.00; // NPR 50 welcome bonus

    const result = db.prepare(`
      INSERT INTO users (phone_or_email, full_name, password_hash, role, referral_code, referred_by, balance)
      VALUES (?, ?, ?, 'user', ?, ?, ?)
    `).run(
      normalizedInput,
      full_name || 'CATL Member',
      passwordHash,
      newRefCode,
      inviterCode,
      welcomeBonus
    );

    const userId = Number(result.lastInsertRowid);

    // Record welcome bonus transaction
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, status, payment_method, payment_details)
      VALUES (?, 'gift_code', ?, 'completed', 'System Bonus', 'New Registration Welcome Bonus')
    `).run(userId, welcomeBonus);

    const sessionPayload = {
      id: userId,
      phone_or_email: normalizedInput,
      full_name: full_name || 'CATL Member',
      role: 'user' as const,
      referral_code: newRefCode
    };

    const token = await createToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: sessionPayload
    });

    response.cookies.set('catl_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
