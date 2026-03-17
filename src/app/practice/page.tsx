import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import PracticeClient from './PracticeClient';

export default function PracticePage() {
  return (
    <main className="container">
      <SiteHeader />
      <Suspense fallback={<div className="card">加载中...</div>}>
        <PracticeClient />
      </Suspense>
    </main>
  );
}
