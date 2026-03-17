import { PracticeQuestion } from './types';

const APP_TOKEN = process.env.FEISHU_APP_TOKEN!;
const TABLE_ID = process.env.FEISHU_TABLE_ID!;
const APP_ID = process.env.FEISHU_BASE_APP_ID;
const APP_SECRET = process.env.FEISHU_BASE_APP_SECRET;

async function getTenantAccessToken() {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('Missing FEISHU_BASE_APP_ID or FEISHU_BASE_APP_SECRET');
  }

  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg || 'Failed to get Feishu tenant access token');
  }
  return data.tenant_access_token as string;
}

export async function listQuestionsFromBitable(): Promise<PracticeQuestion[]> {
  if (!APP_TOKEN || !TABLE_ID) {
    return [];
  }

  if (!APP_ID || !APP_SECRET) {
    return [
      {
        id: 'demo-1',
        type: 'single_choice',
        stem: '在软件架构设计中，高内聚低耦合的主要价值是？',
        optionsJson: [
          { key: 'A', text: '减少机房面积' },
          { key: 'B', text: '提高模块独立演化与可维护性' },
          { key: 'C', text: '降低显示器功耗' },
          { key: 'D', text: '减少办公座位' },
        ],
        answerJson: ['B'],
        analysis: '高内聚低耦合的核心目标是提高模块独立性，降低相互影响。',
        tags: ['软件架构', '模块设计'],
        difficulty: 1,
      },
      {
        id: 'demo-2',
        type: 'multiple_choice',
        stem: '以下哪些属于常见的软件质量属性？',
        optionsJson: [
          { key: 'A', text: '性能' },
          { key: 'B', text: '可用性' },
          { key: 'C', text: '可维护性' },
          { key: 'D', text: '办公地点' },
        ],
        answerJson: ['A', 'B', 'C'],
        analysis: '性能、可用性、可维护性都是典型质量属性，办公地点不是。',
        tags: ['质量属性'],
        difficulty: 1,
      },
    ];
  }

  const token = await getTenantAccessToken();
  const res = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=200`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg || 'Failed to fetch bitable records');
  }

  return (data.data?.items || []).map((item: any) => {
    const f = item.fields || {};
    return {
      id: String(f['题目ID'] || item.record_id),
      type: String(f['题型'] || 'single_choice'),
      stem: String(f['题干'] || ''),
      optionsJson: JSON.parse(String(f['选项JSON'] || '[]')),
      answerJson: JSON.parse(String(f['答案JSON'] || '[]')),
      analysis: String(f['解析'] || ''),
      tags: Array.isArray(f['标签']) ? f['标签'] : [],
      difficulty: Number(f['难度'] || 1),
    } as PracticeQuestion;
  });
}
