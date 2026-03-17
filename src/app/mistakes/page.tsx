"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { WrongRecord } from '@/lib/types';

export default function MistakesPage() {
  const [items, setItems] = useState<WrongRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wrong-book')
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container">
      <SiteHeader />
      <div className="card">
        <h2>错题本</h2>
        <p className="subtitle">点击题目可进入重做。</p>
        {loading ? <p className="muted">加载中...</p> : null}
        {!loading && !items.length ? <p className="muted">当前还没有错题。</p> : null}
        {!!items.length ? (
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>题目ID</th>
                <th>题干</th>
                <th>标签</th>
                <th>错题次数</th>
                <th>最后状态</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.questionId}</td>
                  <td><Link href={`/mistakes/${item.questionId}`} style={{ color: '#2563eb' }}>{item.stem}</Link></td>
                  <td>{item.tags.join(', ')}</td>
                  <td>{item.wrongCount}</td>
                  <td>{item.lastStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </main>
  );
}
