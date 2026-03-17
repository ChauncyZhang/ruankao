"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { WrongRecord } from '@/lib/types';

export default function MistakesPage() {
  const [items, setItems] = useState<WrongRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'wrong'>('wrong');
  const [tagFilter, setTagFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/wrong-book')
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((item) => item.tags || []))), [items]);

  const filteredItems = useMemo(() => {
    return [...items]
      .filter((item) => (statusFilter === 'wrong' ? item.lastStatus === 'wrong' : true))
      .filter((item) => (tagFilter === 'all' ? true : item.tags.includes(tagFilter)))
      .sort((a, b) => b.wrongCount - a.wrongCount);
  }, [items, statusFilter, tagFilter]);

  const reviewQuery = useMemo(() => filteredItems.map((item) => item.questionId).join(','), [filteredItems]);

  return (
    <main className="container">
      <SiteHeader />
      <div className="card">
        <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>错题本</h2>
            <p className="subtitle" style={{ marginTop: 8 }}>默认只看未纠正错题，并按错题次数降序排列。</p>
          </div>
          {!!filteredItems.length ? <Link href={`/practice?review=${reviewQuery}`} className="btn">开始错题重刷</Link> : null}
        </div>

        <div className="actions" style={{ marginTop: 16 }}>
          <button className={`btn secondary ${statusFilter === 'wrong' ? 'active' : ''}`} onClick={() => setStatusFilter('wrong')}>只看未纠正</button>
          <button className={`btn secondary ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>全部错题记录</button>
        </div>

        {!!allTags.length ? (
          <div className="segmented" style={{ marginTop: 12 }}>
            <button className={`btn secondary ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>全部标签</button>
            {allTags.map((tag) => (
              <button key={tag} className={`btn secondary ${tagFilter === tag ? 'active' : ''}`} onClick={() => setTagFilter(tag)}>{tag}</button>
            ))}
          </div>
        ) : null}

        {loading ? <p className="muted">加载中...</p> : null}
        {!loading && !filteredItems.length ? <p className="muted">当前筛选条件下没有错题。</p> : null}
        {!!filteredItems.length ? (
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
              {filteredItems.map((item) => (
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
