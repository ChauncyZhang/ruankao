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

type Mode = 'sequence' | 'random' | 'exam';

type TagGroup = {
  key: string;
  title: string;
  tags: string[];
};

function getTagGroup(tag: string) {
  if (tag.startsWith('章节:')) return 'chapter';
  if (tag.startsWith('主题:')) return 'topic';
  if (tag.startsWith('能力:')) return 'ability';
  return 'other';
}

function getModeLabel(mode: Mode, reviewIds: string | null) {
  if (reviewIds) return '错题重刷';
  if (mode === 'sequence') return '顺序刷题';
  if (mode === 'random') return '随机刷题';
  return '模拟考试';
}

export default function PracticeClient() {
  const searchParams = useSearchParams();
  const reviewIds = searchParams.get('review');

  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [mode, setMode] = useState<Mode>('sequence');
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

  const tagGroups = useMemo<TagGroup[]>(() => {
    const buckets: Record<string, string[]> = {
      chapter: [],
      topic: [],
      ability: [],
      other: [],
    };

    allTags.forEach((tag) => {
      buckets[getTagGroup(tag)].push(tag);
    });

    return [
      { key: 'chapter', title: '按章节筛选', tags: buckets.chapter },
      { key: 'topic', title: '按主题筛选', tags: buckets.topic },
      { key: 'ability', title: '按能力筛选', tags: buckets.ability },
      { key: 'other', title: '其他标签', tags: buckets.other },
    ].filter((group) => group.tags.length > 0);
  }, [allTags]);

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
    nextMode: Mode,
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
  const modeLabel = getModeLabel(mode, reviewIds);
  const selectedTagLabel = activeTag === 'all' ? '全部内容' : activeTag;

  const applyFilters = (nextMode: Mode, nextTag: string, nextExamCount = examCount) => {
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

  const scrollToCurrentQuestion = () => {
    document.getElementById('current-question')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="practice-header-row">
          <div>
            <div><strong>刷题模式</strong></div>
            <div className="subtitle" style={{ marginTop: 8 }}>
              先选模式，再按章节 / 主题 / 能力缩小范围，然后直接开始刷题。
            </div>
          </div>
          <div className="segmented">
            <button className={`btn secondary ${mode === 'sequence' ? 'active' : ''}`} onClick={() => applyFilters('sequence', activeTag)}>
              顺序刷题
            </button>
            <button className={`btn secondary ${mode === 'random' ? 'active' : ''}`} onClick={() => applyFilters('random', activeTag)}>
              随机刷题
            </button>
            <button className={`btn secondary ${mode === 'exam' ? 'active' : ''}`} onClick={() => applyFilters('exam', activeTag, examCount)}>
              模拟考试
            </button>
          </div>
        </div>

        {reviewIds ? <div className="muted" style={{ marginTop: 12 }}>当前模式：错题重刷</div> : null}

        {mode === 'exam' ? (
          <div className="actions" style={{ marginTop: 12, alignItems: 'center' }}>
            <span className="muted">题量：</span>
            {[5, 10, 20].map((count) => (
              <button
                key={count}
                className={`btn secondary ${examCount === count ? 'active' : ''}`}
                onClick={() => applyFilters('exam', activeTag, count)}
              >
                {count} 题
              </button>
            ))}
          </div>
        ) : null}

        <div className="practice-summary">
          <div className="practice-summary-grid">
            <div>
              <div className="muted">当前模式</div>
              <div className="practice-summary-value">{modeLabel}</div>
            </div>
            <div>
              <div className="muted">当前筛选</div>
              <div className="practice-summary-value">{selectedTagLabel}</div>
            </div>
            <div>
              <div className="muted">匹配题数</div>
              <div className="practice-summary-value">{loading ? '--' : `${questions.length} 题`}</div>
            </div>
          </div>
          <div className="actions">
            <button className="btn" onClick={scrollToCurrentQuestion} disabled={loading || !questions.length}>
              {mode === 'exam' ? '开始模拟考试' : '开始刷题'}
            </button>
            {activeTag !== 'all' ? (
              <button className="btn secondary" onClick={() => applyFilters(mode, 'all', examCount)}>
                清空筛选
              </button>
            ) : null}
          </div>
        </div>

        {!!tagGroups.length ? (
          <div className="practice-filter-groups">
            <div className="filter-group">
              <div className="filter-group-title">快捷筛选</div>
              <div className="segmented">
                <button className={`btn secondary ${activeTag === 'all' ? 'active' : ''}`} onClick={() => applyFilters(mode, 'all', examCount)}>
                  全部内容
                </button>
              </div>
            </div>
            {tagGroups.map((group) => (
              <div key={group.key} className="filter-group">
                <div className="filter-group-title">{group.title}</div>
                <div className="segmented">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      className={`btn secondary ${activeTag === tag ? 'active' : ''}`}
                      onClick={() => applyFilters(mode, tag, examCount)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
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
      {!loading && !questions.length ? <div className="card">当前筛选条件下暂无题目，请切换模式或清空筛选后重试。</div> : null}

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
          <div className="card" id="current-question" style={{ marginBottom: 16 }}>
            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <div><strong>当前进度：</strong>第 {index + 1} / {questions.length} 题</div>
              <div className="muted">模式：{modeLabel}</div>
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
