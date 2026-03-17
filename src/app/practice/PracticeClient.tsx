"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

export default function PracticeClient() {
  const searchParams = useSearchParams();
  const reviewIds = searchParams.get('review');

  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [mode, setMode] = useState<'sequence' | 'random' | 'exam'>('sequence');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [examCount, setExamCount] = useState<number>(10);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultMap, setResultMap] = useState<Record<string, boolean>>({});

  const allTags = useMemo(() => {
    return Array.from(new Set(allQuestions.flatMap((item) => item.tags || [])));
  }, [allQuestions]);

  const stats = useMemo(() => {
    const values = Object.values(resultMap);
    const total = values.length;
    const correctCount = values.filter(Boolean).length;
    return {
      total,
      correctCount,
      wrongCount: total - correctCount,
      accuracy: total ? Math.round((correctCount / total) * 100) : 0,
    };
  }, [resultMap]);

  const rebuildQuestions = (
    baseItems: PracticeQuestion[],
    nextMode: 'sequence' | 'random' | 'exam',
    tag: string,
    nextExamCount: number,
  ) => {
    let filtered = baseItems;
    if (reviewIds) {
      const idSet = new Set(reviewIds.split(',').filter(Boolean));
      filtered = filtered.filter((item) => idSet.has(item.id));
    }
    if (tag !== 'all') {
      filtered = filtered.filter((item) => (item.tags || []).includes(tag));
    }
    if (nextMode === 'exam') {
      return shuffleArray(filtered).slice(0, Math.min(nextExamCount, filtered.length));
    }
    return nextMode === 'random' ? shuffleArray(filtered) : [...filtered];
  };

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        setAllQuestions(items);
        setQuestions(rebuildQuestions(items, 'sequence', 'all', examCount));
      })
      .finally(() => setLoading(false));
  }, [reviewIds]);

  const question = useMemo(() => questions[index], [questions, index]);
  const correct = submitted && question ? isAnswerCorrect(selected, question.answerJson) : null;

  const applyFilters = (nextMode: 'sequence' | 'random' | 'exam', nextTag: string, nextExamCount = examCount) => {
    const nextQuestions = rebuildQuestions(allQuestions, nextMode, nextTag, nextExamCount);
    setMode(nextMode);
    setActiveTag(nextTag);
    setExamCount(nextExamCount);
    setQuestions(nextQuestions);
    setIndex(0);
    setSelected([]);
    setSubmitted(false);
    setFinished(false);
    setResultMap({});
  };

  const submitAnswer = async () => {
    if (!question || !selected.length || submitted) return;
    const isCorrectNow = isAnswerCorrect(selected, question.answerJson);
    setResultMap((prev) => ({ ...prev, [question.id]: isCorrectNow }));
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
    applyFilters(mode, activeTag, examCount);
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>刷题模式</strong></div>
          <div className="segmented">
            <button className={`btn secondary ${mode === 'sequence' ? 'active' : ''}`} onClick={() => applyFilters('sequence', activeTag)}>顺序刷题</button>
            <button className={`btn secondary ${mode === 'random' ? 'active' : ''}`} onClick={() => applyFilters('random', activeTag)}>随机刷题</button>
            <button className={`btn secondary ${mode === 'exam' ? 'active' : ''}`} onClick={() => applyFilters('exam', activeTag, examCount)}>模拟考试</button>
          </div>
        </div>
        {reviewIds ? <div className="muted" style={{ marginTop: 12 }}>当前模式：错题重刷</div> : null}
        {mode === 'exam' ? (
          <div className="actions" style={{ marginTop: 12, alignItems: 'center' }}>
            <span className="muted">题量：</span>
            {[5, 10, 20].map((count) => (
              <button key={count} className={`btn secondary ${examCount === count ? 'active' : ''}`} onClick={() => applyFilters('exam', activeTag, count)}>{count} 题</button>
            ))}
          </div>
        ) : null}
        {!!allTags.length ? (
          <div className="segmented" style={{ marginTop: 12 }}>
            <button className={`btn secondary ${activeTag === 'all' ? 'active' : ''}`} onClick={() => applyFilters(mode, 'all', examCount)}>全部内容</button>
            {allTags.map((tag) => (
              <button key={tag} className={`btn secondary ${activeTag === tag ? 'active' : ''}`} onClick={() => applyFilters(mode, tag, examCount)}>{tag}</button>
            ))}
          </div>
        ) : null}
      </div>

      {mode === 'exam' ? (
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <div className="card"><div className="muted">已答题数</div><div className="kpi">{stats.total}</div></div>
          <div className="card"><div className="muted">答对题数</div><div className="kpi">{stats.correctCount}</div></div>
          <div className="card"><div className="muted">当前正确率</div><div className="kpi">{stats.accuracy}%</div></div>
        </div>
      ) : null}

      {loading ? <div className="card">加载中...</div> : null}
      {!loading && !questions.length ? <div className="card">当前筛选条件下暂无题目。</div> : null}

      {!loading && finished ? (
        <div className="card center-empty">
          <h2>{mode === 'exam' ? '本次模拟考试已完成' : '本轮刷题已完成'}</h2>
          <p className="subtitle">{mode === 'exam' ? `共 ${stats.total} 题，答对 ${stats.correctCount} 题，正确率 ${stats.accuracy}%` : '你可以重新开始，或者去错题本继续复盘。'}</p>
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
              <div className="muted">模式：{reviewIds ? '错题重刷' : mode === 'sequence' ? '顺序刷题' : mode === 'random' ? '随机刷题' : '模拟考试'}</div>
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
              <button className="btn" onClick={nextQuestion}>{index >= questions.length - 1 ? (mode === 'exam' ? '提交试卷' : '完成本轮') : '下一题'}</button>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
