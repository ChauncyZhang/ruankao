import { NextResponse } from 'next/server';
import { listQuestionsFromBitable } from '@/lib/feishu';
import { isAnswerCorrect } from '@/lib/helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = await listQuestionsFromBitable();
    const question = items.find((item) => item.id === body.questionId);

    if (!question) {
      return NextResponse.json({ message: '题目不存在' }, { status: 404 });
    }

    const correct = isAnswerCorrect(body.answer, question.answerJson);
    return NextResponse.json({ questionId: question.id, correct, correctAnswer: question.answerJson, analysis: question.analysis });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
