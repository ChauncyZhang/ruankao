"use client";

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { StatCard } from '@/components/StatCard';

export default function StatsPage() {
  const [data, setData] = useState<{ wrongCount: number; totalWrongTracked: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  return (
    <main className="container">
      <SiteHeader />
      <section className="grid grid-2">
        <StatCard label="当前错题数" value={data?.wrongCount ?? '-'} hint="最后状态为 wrong 的题目" />
        <StatCard label="错题跟踪总数" value={data?.totalWrongTracked ?? '-'} hint="进入过错题本的题目总数" />
      </section>
    </main>
  );
}
