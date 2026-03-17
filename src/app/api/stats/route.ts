import { NextResponse } from 'next/server';
import { listAttemptRecords, listWrongRecords } from '@/lib/feishu';

export async function GET() {
  try {
    const [attemptItems, wrongItems] = await Promise.all([listAttemptRecords(), listWrongRecords()]);
    const totalAttempts = attemptItems.length;
    const correctCount = attemptItems.filter((item) => item.isCorrect).length;
    const accuracyRate = totalAttempts ? Number((correctCount / totalAttempts).toFixed(4)) : 0;
    const recentAttempts = [...attemptItems]
      .sort((a, b) => Number(b.answeredAt || 0) - Number(a.answeredAt || 0))
      .slice(0, 10);

    return NextResponse.json({
      totalAttempts,
      correctCount,
      accuracyRate,
      wrongCount: wrongItems.filter((item) => item.lastStatus === 'wrong').length,
      totalWrongTracked: wrongItems.length,
      recentAttempts,
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
