"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { isAnswerCorrect } from '@/lib/helpers';
import { PracticeQuestion } from '@/lib/types';

function shuffleArray<T>(items: T[]) {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

export default function PracticePage() {
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [mode, setMode] = useState<'sequence' | 'random'>('sequence');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        setAllQuestions(items);
        setQuestions(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const question = useMemo(() => questions[index], [questions, index]);
  const correct = submitted && question ? isAnswerCorrect(selected, question.answerJson) : null;

  const applyMode = (nextMode: 'sequence' | 'random') => {
    const nextQuestions = nextMode === 'random' ? shuffleArray(allQuestions) : [...allQuestions];
    setMode(nextMode);
    setQuestions(nextQuestions);
    setIndex(0);
    setSelected([]);
    setSubmitted(false);
    setFinished(false);
  };

  const submitAnswer = async () => {
    if (!question || !selected.length || submitted) return;
    setSubmitted(true);
    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, answer: selected }),
    }).catch(() => undefined);
  };

  const nextQuestion = () => {
    if (index >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setSelected([]);
    setSubmitted(false);
    setIndex((prev) => prev + 1);
  };

  const restartRound = () => {
    applyMode(mode);
  };

  return (
    <main className="container">
      <SiteHeader />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>刷题模式</strong></div>
          <div className="segmented">
            <button className={`btn secondary ${mode === 'sequence' ? 'active' : ''}`} onClick={() => applyMode('sequence')}>顺序刷题</button>
            <button className={`btn secondary ${mode === 'random' ? 'active' : ''}`} onClick={() => applyMode('random')}>随机刷题</button>
          </div>
        </div>
      </div>

      {loading ? <div className="card">加载中...</div> : null}
      {!loading && !questions.length ? <div className="card">暂无题目，请先补充飞书多维表数据。</div> : null}

      {!loading && finished ? (
        <div className="card center-empty">
          <h2>本轮刷题已完成</h2>
          <p className="subtitle">你可以重新开始，或者去错题本继续复盘。</p>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={restartRound}>再来一轮</button>
            <Link href="/mistakes" className="btn secondary">去错题本</Link>
            <Link href="/" className="btn secondary">返回首页</Link>
          </div>
        </div>
      ) : null}

      {question && !finished ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <div><strong>当前进度：</strong>第 {index + 1} / {questions.length} 题</div>
              <div className="muted">模式：{mode === 'sequence' ? '顺序刷题' : '随机刷题'}</div>
            </div>
          </div>
          <QuestionCard question={question} selected={selected} onChange={setSelected} showResult={submitted} locked={submitted} />
          {submitted ? (
            <div className="card" style={{ marginTop: 16 }}>
              <strong className={correct ? 'success' : 'danger'}>{correct ? '回答正确' : '回答错误'}</strong>
            </div>
          ) : null}
          <div className="actions" style={{ marginTop: 16 }}>
            {!submitted ? (
              <button className="btn" onClick={submitAnswer} disabled={!selected.length}>提交答案</button>
            ) : (
              <button className="btn" onClick={nextQuestion}>{index >= questions.length - 1 ? '完成本轮' : '下一题'}</button>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
