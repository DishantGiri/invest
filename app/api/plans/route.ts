import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const plans = db.prepare("SELECT * FROM investment_plans WHERE status = 1 ORDER BY vip_level ASC, price ASC").all();
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch investment plans' }, { status: 500 });
  }
}
