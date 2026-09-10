import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { getSessionUser, createToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin authorization required.' }, { status: 403 });
    }

    const { phone_or_email, current_password, new_password } = await req.json();

    if (!current_password) {
      return NextResponse.json({ error: 'Current admin password is required to verify changes.' }, { status: 400 });
    }

    // Get current admin user record
    const adminUser = await queryOne('SELECT * FROM users WHERE id = ? AND role = \'admin\'', [session.id]) as any;
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user record not found.' }, { status: 404 });
    }

    // Verify current password
    const isMatch = bcrypt.compareSync(current_password, adminUser.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password incorrect.' }, { status: 401 });
    }

    let updatedEmail = adminUser.phone_or_email;
    let updatedPasswordHash = adminUser.password_hash;
    let changesMade = false;

    // Check if new Admin ID / Email is provided and different
    if (phone_or_email && phone_or_email.trim().toLowerCase() !== adminUser.phone_or_email.toLowerCase()) {
      const normalizedEmail = phone_or_email.trim().toLowerCase();

      // Check if email/ID is already in use by another user
      const existingUser = await queryOne('SELECT id FROM users WHERE LOWER(phone_or_email) = ? AND id != ?', [normalizedEmail, session.id]);
      if (existingUser) {
        return NextResponse.json({ error: 'That Email / Username is already in use by another account.' }, { status: 400 });
      }

      updatedEmail = normalizedEmail;
      changesMade = true;
    }

    // Check if new password is provided
    if (new_password) {
      if (new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }
      updatedPasswordHash = bcrypt.hashSync(new_password, 10);
      changesMade = true;
    }

    if (!changesMade) {
      return NextResponse.json({ error: 'No changes detected in Admin ID or Password.' }, { status: 400 });
    }

    // Update database
    await execute(`
      UPDATE users
      SET phone_or_email = ?, password_hash = ?
      WHERE id = ?
    `, [updatedEmail, updatedPasswordHash, session.id]);

    // Create updated session payload & update auth cookie
    const updatedSessionPayload = {
      ...session,
      phone_or_email: updatedEmail
    };

    const newToken = await createToken(updatedSessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Admin ID and/or password updated successfully!',
      user: {
        id: session.id,
        phone_or_email: updatedEmail,
        role: session.role
      }
    });

    response.cookies.set('catl_auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error('Admin credentials update error:', error);
    return NextResponse.json({ error: 'Failed to update admin credentials' }, { status: 500 });
  }
}
