import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const giftCodes = await query(`
      SELECT gc.*, COUNT(ugc.id) as actual_claims
      FROM gift_codes gc
      LEFT JOIN user_gift_claims ugc ON gc.id = ugc.gift_code_id
      GROUP BY gc.id
      ORDER BY gc.id DESC
    `);

    return NextResponse.json({ success: true, giftCodes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch gift codes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, code, amount, max_uses } = await req.json();

    if (!code || !amount) {
      return NextResponse.json({ error: 'Code and Amount are required' }, { status: 400 });
    }

    const codeStr = code.trim().toUpperCase();
    const codeAmount = Number(amount);
    const codeMaxUses = max_uses ? Number(max_uses) : 100;

    if (id) {
      // Edit existing
      await execute(`
        UPDATE gift_codes
        SET code = ?, amount = ?, max_uses = ?
        WHERE id = ?
      `, [codeStr, codeAmount, codeMaxUses, id]);

      return NextResponse.json({ success: true, message: 'Gift Code updated!' });
    } else {
      // Create new
      const existing = await queryOne('SELECT id FROM gift_codes WHERE code = ?', [codeStr]);
      if (existing) {
        return NextResponse.json({ error: 'Gift Code already exists' }, { status: 400 });
      }

      await execute(`
        INSERT INTO gift_codes (code, amount, max_uses, times_used)
        VALUES (?, ?, ?, 0)
      `, [codeStr, codeAmount, codeMaxUses]);

      return NextResponse.json({ success: true, message: 'New Gift Code created successfully!' });
    }
  } catch (error: any) {
    console.error('Admin Gift Code Error:', error);
    return NextResponse.json({ error: 'Failed to save gift code' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json({ error: 'Code ID is required' }, { status: 400 });
    }

    await execute('DELETE FROM user_gift_claims WHERE gift_code_id = ?', [codeId]);
    await execute('DELETE FROM gift_codes WHERE id = ?', [codeId]);

    return NextResponse.json({ success: true, message: 'Gift Code deleted!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete gift code' }, { status: 500 });
  }
}
