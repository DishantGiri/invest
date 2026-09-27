import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await query(`
      SELECT id, phone_or_email, full_name, role, referral_code, referred_by,
             balance, total_income, total_recharge, total_withdrawal,
             bank_name, account_name, account_number, created_at
      FROM users
      ORDER BY id DESC
    `);

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // CREATE NEW USER
    if (action === 'create') {
      const { phone_or_email, full_name, password, role, balance, referred_by } = body;

      if (!phone_or_email || !password) {
        return NextResponse.json({ error: 'Phone/Email and Password are required' }, { status: 400 });
      }

      const existing = await queryOne('SELECT id FROM users WHERE phone_or_email = ?', [phone_or_email.trim()]);
      if (existing) {
        return NextResponse.json({ error: 'User with this Phone/Email already exists' }, { status: 400 });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const referralCode = 'CATL' + Math.floor(100000 + Math.random() * 900000);

      const newUser = await queryOne(`
        INSERT INTO users (phone_or_email, full_name, password_hash, role, referral_code, referred_by, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `, [
        phone_or_email.trim(),
        full_name ? full_name.trim() : '',
        passwordHash,
        role || 'user',
        referralCode,
        referred_by ? referred_by.trim() : null,
        Number(balance || 0)
      ]);

      return NextResponse.json({
        success: true,
        message: 'New user created successfully!',
        userId: newUser?.id
      });
    }

    // UPDATE EXISTING USER (FULL EDIT)
    const userId = body.userId || body.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update standard profile & financial fields
    const {
      full_name,
      phone_or_email,
      role,
      balance,
      total_income,
      total_recharge,
      total_withdrawal,
      bank_name,
      account_name,
      account_number,
      new_password
    } = body;

    if (full_name !== undefined) {
      await execute('UPDATE users SET full_name = ? WHERE id = ?', [full_name.trim(), userId]);
    }

    if (phone_or_email !== undefined && phone_or_email.trim()) {
      await execute('UPDATE users SET phone_or_email = ? WHERE id = ?', [phone_or_email.trim(), userId]);
    }

    if (role && (role === 'user' || role === 'admin')) {
      await execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }

    if (balance !== undefined && !isNaN(Number(balance))) {
      await execute('UPDATE users SET balance = ? WHERE id = ?', [Number(balance), userId]);
    }

    if (total_income !== undefined && !isNaN(Number(total_income))) {
      await execute('UPDATE users SET total_income = ? WHERE id = ?', [Number(total_income), userId]);
    }

    if (total_recharge !== undefined && !isNaN(Number(total_recharge))) {
      await execute('UPDATE users SET total_recharge = ? WHERE id = ?', [Number(total_recharge), userId]);
    }

    if (total_withdrawal !== undefined && !isNaN(Number(total_withdrawal))) {
      await execute('UPDATE users SET total_withdrawal = ? WHERE id = ?', [Number(total_withdrawal), userId]);
    }

    if (bank_name !== undefined) {
      await execute('UPDATE users SET bank_name = ? WHERE id = ?', [bank_name.trim(), userId]);
    }

    if (account_name !== undefined) {
      await execute('UPDATE users SET account_name = ? WHERE id = ?', [account_name.trim(), userId]);
    }

    if (account_number !== undefined) {
      await execute('UPDATE users SET account_number = ? WHERE id = ?', [account_number.trim(), userId]);
    }

    if (new_password && new_password.trim().length >= 6) {
      const passwordHash = bcrypt.hashSync(new_password.trim(), 10);
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully!' });
  } catch (error: any) {
    console.error('Admin User Edit Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is current logged in admin
    if (Number(userId) === session.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account!' }, { status: 400 });
    }

    // Clean up user related records
    await execute('DELETE FROM user_investments WHERE user_id = ?', [userId]);
    await execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
    await execute('DELETE FROM user_gift_claims WHERE user_id = ?', [userId]);
    await execute('DELETE FROM referral_commissions WHERE referrer_id = ? OR referee_id = ?', [userId, userId]);
    await execute('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ success: true, message: 'User and all associated records deleted permanently!' });
  } catch (error: any) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
