"use client";

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { isAnswerCorrect } from '@/lib/helpers';
import { PracticeQuestion } from '@/lib/types';

export default function PracticePage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => setQuestions(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const question = useMemo(() => questions[index], [questions, index]);
  const correct = submitted && question ? isAnswerCorrect(selected, question.answerJson) : null;

  const submitAnswer = async () => {
    if (!question || !selected.length) return;
    setSubmitted(true);
    setSaving(true);
    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, answer: selected }),
    })
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };

  const nextQuestion = () => {
    setSelected([]);
    setSubmitted(false);
    setSaving(false);
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
          <QuestionCard question={question} selected={selected} onChange={setSelected} showResult={submitted} />
          {submitted ? (
            <div className="card" style={{ marginTop: 16 }}>
              <strong className={correct ? 'success' : 'danger'}>{correct ? '回答正确' : '回答错误'}</strong>
              <div className="muted" style={{ marginTop: 8 }}>{saving ? '正在后台保存记录...' : '结果已显示，可继续下一题'}</div>
            </div>
          ) : null}
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
