import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="header">
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>🎓 高级架构师刷题系统</h1>
        <p className="subtitle">Vercel 部署，Feishu 多维表存储</p>
      </div>
      <nav className="nav">
        <Link href="/">首页</Link>
        <Link href="/practice">刷题</Link>
        <Link href="/mistakes">错题本</Link>
        <Link href="/stats">统计</Link>
      </nav>
    </header>
  );
}
