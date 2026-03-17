import { SiteHeader } from '@/components/SiteHeader';

export default function MistakesPage() {
  return (
    <main className="container">
      <SiteHeader />
      <div className="card">
        <h2>错题本</h2>
        <p className="subtitle">当前版本先完成 Vercel + 飞书多维表接入。错题自动回写会放在下一步。</p>
      </div>
    </main>
  );
}
