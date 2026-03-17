import { SiteHeader } from '@/components/SiteHeader';

export default function StatsPage() {
  return (
    <main className="container">
      <SiteHeader />
      <div className="card">
        <h2>统计页</h2>
        <p className="subtitle">当前版本先完成刷题与题库读取。统计会在接入做题记录后补齐。</p>
      </div>
    </main>
  );
}
