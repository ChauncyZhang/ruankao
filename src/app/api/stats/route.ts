import { NextResponse } from 'next/server';
import { listWrongRecords } from '@/lib/feishu';

export async function GET() {
  try {
    const wrongItems = await listWrongRecords();
    return NextResponse.json({
      wrongCount: wrongItems.filter((item) => item.lastStatus === 'wrong').length,
      totalWrongTracked: wrongItems.length,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
