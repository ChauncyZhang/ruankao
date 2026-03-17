import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { StatCard } from '@/components/StatCard';

export default function HomePage() {
  return (
    <main className="container">
      <SiteHeader />
      <section className="grid grid-3">
        <StatCard label="部署方式" value="Vercel" hint="适合你远程访问" />
        <StatCard label="数据存储" value="Feishu 多维表" hint="轻量、够用、自用" />
        <StatCard label="当前状态" value="已接入骨架" hint="可继续上真实题库" />
      </section>
      <section className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>你现在能直接用的模块</h2>
          <div className="list muted">
            <div>1. 首页</div>
            <div>2. 刷题页</div>
            <div>3. 错题本页（占位）</div>
            <div>4. 统计页（占位）</div>
            <div>5. Feishu Bitable 读取接口</div>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <Link href="/practice" className="btn">开始刷题</Link>
          </div>
        </div>
        <div className="card">
          <h2>当前接入说明</h2>
          <div className="list muted">
            <div>1. 前端页面跑在 Vercel</div>
            <div>2. 服务端 API 读取飞书多维表</div>
            <div>3. 前端不暴露飞书密钥</div>
            <div>4. 先内置 2 道示例题兜底</div>
          </div>
        </div>
      </section>
    </main>
  );
}
