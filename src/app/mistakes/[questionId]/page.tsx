"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { PracticeQuestion } from '@/lib/types';
import { isAnswerCorrect } from '@/lib/helpers';

export default function MistakeDetailPage() {
  const params = useParams<{ questionId: string }>();
  const questionId = params?.questionId;
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => setQuestions(data.items || []));
  }, []);

  const question = useMemo(() => questions.find((item) => item.id === questionId), [questions, questionId]);
  const correct = question && submitted ? isAnswerCorrect(selected, question.answerJson) : null;

  const submitAsync = async () => {
    if (!question || submitted || !selected.length) return;
    setSubmitted(true);
    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, answer: selected }),
    }).catch(() => undefined);
  };

  return (
    <main className="container">
      <SiteHeader />
      <div className="actions" style={{ marginBottom: 16 }}>
        <Link href="/mistakes" className="btn secondary">返回错题本</Link>
      </div>
      {!question ? <div className="card">题目加载中或不存在。</div> : null}
      {question ? (
        <>
          <QuestionCard question={question} selected={selected} onChange={setSelected} showResult={submitted} locked={submitted} />
          {submitted ? (
            <div className="card" style={{ marginTop: 16 }}>
              <strong className={correct ? 'success' : 'danger'}>{correct ? '回答正确' : '回答错误'}</strong>
            </div>
          ) : null}
          <div className="actions" style={{ marginTop: 16 }}>
            {!submitted ? <button className="btn" onClick={submitAsync} disabled={!selected.length}>提交答案</button> : null}
            {submitted ? <Link href="/mistakes" className="btn">返回错题本</Link> : null}
            {submitted ? <Link href="/practice" className="btn secondary">继续刷题</Link> : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
