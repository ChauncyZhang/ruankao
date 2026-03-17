import { NextResponse } from 'next/server';
import { listQuestionsFromBitable } from '@/lib/feishu';

export async function GET() {
  try {
    const items = await listQuestionsFromBitable();
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
