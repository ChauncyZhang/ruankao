"use client";

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { StatCard } from '@/components/StatCard';

type StatsData = {
  totalAttempts: number;
  correctCount: number;
  accuracyRate: number;
  wrongCount: number;
  totalWrongTracked: number;
  recentAttempts: Array<{
    id: string;
    questionId: string;
    stem: string;
    isCorrect: boolean;
    answeredAt?: string;
  }>;
};

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  return (
    <main className="container">
      <SiteHeader />
      <section className="grid grid-3">
        <StatCard label="总作答数" value={data?.totalAttempts ?? '-'} hint="累计 attempt 记录" />
        <StatCard label="总答对数" value={data?.correctCount ?? '-'} hint="累计答对题目数" />
        <StatCard label="总正确率" value={data ? `${Math.round(data.accuracyRate * 100)}%` : '-'} hint="基于全部作答记录" />
      </section>

      <section className="grid grid-2" style={{ marginTop: 20 }}>
        <StatCard label="当前错题数" value={data?.wrongCount ?? '-'} hint="最后状态为 wrong 的题目" />
        <StatCard label="错题跟踪总数" value={data?.totalWrongTracked ?? '-'} hint="进入过错题本的题目总数" />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>最近作答</h2>
        {!data?.recentAttempts?.length ? <p className="muted">暂无作答记录</p> : null}
        {!!data?.recentAttempts?.length ? (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>题目ID</th>
                <th>题干</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAttempts.map((item) => (
                <tr key={item.id}>
                  <td>{item.questionId}</td>
                  <td>{item.stem}</td>
                  <td className={item.isCorrect ? 'success' : 'danger'}>{item.isCorrect ? '正确' : '错误'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  );
}
