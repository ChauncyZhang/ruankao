import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '高级架构师刷题系统',
  description: 'Vercel + Feishu Bitable 版刷题网站',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
