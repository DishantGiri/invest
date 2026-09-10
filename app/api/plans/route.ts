import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const plans = await query("SELECT * FROM investment_plans WHERE status = 1 ORDER BY vip_level ASC, price ASC");
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch investment plans' }, { status: 500 });
  }
}
