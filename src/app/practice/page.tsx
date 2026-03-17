"use client";

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { PracticeQuestion } from '@/lib/types';

export default function PracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ correct: boolean; analysis?: string; correctAnswer?: string[] } | null>(null);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => setQuestions(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const question = useMemo(() => questions[index], [questions, index]);

  const submitAnswer = async () => {
    if (!question || !selected.length) return;
    const res = await fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, answer: selected }),
    });
    const data = await res.json();
    setResult({ correct: !!data.correct, analysis: data.analysis, correctAnswer: data.correctAnswer || [] });
    setSubmitted(true);
  };

  const nextQuestion = () => {
    setSelected([]);
    setSubmitted(false);
    setResult(null);
    setIndex((prev) => (questions.length ? (prev + 1) % questions.length : 0));
  };

  return (
    <main className="container">
      <SiteHeader />
      {loading ? <div className="card">加载中...</div> : null}
      {!loading && !question ? <div className="card">暂无题目，请先补充飞书多维表数据。</div> : null}
      {question ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <div><strong>当前进度：</strong>第 {index + 1} / {questions.length} 题</div>
              <div className="muted">数据源：Feishu Bitable</div>
            </div>
          </div>
          <QuestionCard question={{ ...question, answerJson: result?.correctAnswer || question.answerJson, analysis: result?.analysis || question.analysis }} selected={selected} onChange={setSelected} showResult={submitted} />
          {submitted && result ? <div className="card" style={{ marginTop: 16 }}><strong className={result.correct ? 'success' : 'danger'}>{result.correct ? '回答正确' : '回答错误，已记入做题记录'}</strong></div> : null}
          <div className="actions" style={{ marginTop: 16 }}>
            {!submitted ? (
              <button className="btn" onClick={submitAnswer} disabled={!selected.length}>提交答案</button>
            ) : (
              <button className="btn" onClick={nextQuestion}>下一题</button>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
