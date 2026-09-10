import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone_or_email, password } = await req.json();

    if (!phone_or_email || !password) {
      return NextResponse.json({ error: 'Phone / Email and password required' }, { status: 400 });
    }

    const normalizedInput = phone_or_email.trim().toLowerCase();

    const user = await queryOne('SELECT * FROM users WHERE LOWER(phone_or_email) = ?', [normalizedInput]) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401 });
    }

    const sessionPayload = {
      id: user.id,
      phone_or_email: user.phone_or_email,
      full_name: user.full_name || 'CATL Member',
      role: user.role as 'user' | 'admin',
      referral_code: user.referral_code
    };

    const token = await createToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
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
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
