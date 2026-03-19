import { AttemptRecord, PracticeQuestion, WrongRecord } from './types';

type FeishuTokenResponse = {
  code: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
};

type FeishuRecord = {
  record_id: string;
  fields: Record<string, unknown>;
};

type FeishuListResponse = {
  code: number;
  msg?: string;
  data?: {
    has_more?: boolean;
    page_token?: string;
    items?: FeishuRecord[];
  };
};

const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';
const QUESTION_FIELD_ALIASES = {
  stem: ['题干', '题目', '题目内容', 'stem', 'question'],
  type: ['题型', 'type'],
  options: ['选项', 'options', 'optionsJson', '选项JSON'],
  answer: ['答案', '正确答案', 'answer', 'answerJson', '答案JSON'],
  analysis: ['解析', 'analysis'],
  difficulty: ['难度', 'difficulty'],
  tagsText: ['标签文本', 'tagsText'],
  tags: ['标签', 'tags'],
} as const;

function getEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

function getRequiredConfig() {
  return {
    appId: getEnv('FEISHU_APP_ID', 'FEISHU_BASE_APP_ID'),
    appSecret: getEnv('FEISHU_APP_SECRET', 'FEISHU_BASE_APP_SECRET'),
    appToken: getEnv('FEISHU_BITABLE_APP_TOKEN', 'FEISHU_APP_TOKEN'),
    tableId: getEnv('FEISHU_BITABLE_TABLE_ID', 'FEISHU_TABLE_ID'),
  };
}

function getFieldValue(fields: Record<string, unknown>, aliases: readonly string[]) {
  for (const key of aliases) {
    if (key in fields && fields[key] != null) {
      return fields[key];
    }
  }
  return null;
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function normalizeQuestionType(input: unknown): PracticeQuestion['type'] {
  const raw = String(input ?? '').trim().toLowerCase();
  const compact = raw.replace(/[\s-]/g, '_');

  const typeMap: Record<string, PracticeQuestion['type']> = {
    single_choice: 'single_choice',
    single: 'single_choice',
    radio: 'single_choice',
    单选: 'single_choice',
    单选题: 'single_choice',
    multiple_choice: 'multiple_choice',
    multiple: 'multiple_choice',
    checkbox: 'multiple_choice',
    多选: 'multiple_choice',
    多选题: 'multiple_choice',
    judge: 'judge',
    true_false: 'judge',
    判断: 'judge',
    判断题: 'judge',
    short_answer: 'short_answer',
    简答: 'short_answer',
    简答题: 'short_answer',
    case_analysis: 'case_analysis',
    case: 'case_analysis',
    案例: 'case_analysis',
    案例题: 'case_analysis',
    案例分析: 'case_analysis',
    案例分析题: 'case_analysis',
  };

  return typeMap[compact] ?? 'single_choice';
}

function normalizeDifficulty(input: unknown) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(1, Math.min(5, Math.round(input)));
  }

  const raw = String(input ?? '').trim();
  const matched = raw.match(/\d+/);
  if (matched) {
    return Math.max(1, Math.min(5, Number(matched[0])));
  }

  const textMap: Record<string, number> = {
    简单: 1,
    容易: 1,
    中等: 2,
    一般: 2,
    偏难: 3,
    困难: 4,
  };

  return textMap[raw] ?? 2;
}

function normalizeOptions(input: unknown, type: PracticeQuestion['type']) {
  if (type === 'judge' && !input) {
    return [
      { key: 'true', text: '正确' },
      { key: 'false', text: '错误' },
    ];
  }

  if (Array.isArray(input)) {
    return input
      .map((item, index) => {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const key = String(obj.key ?? obj.label ?? obj.value ?? String.fromCharCode(65 + index)).trim();
          const text = String(obj.text ?? obj.content ?? obj.name ?? '').trim();
          return text ? { key, text } : null;
        }
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (!trimmed) return null;
          const matched = trimmed.match(/^([A-Za-z]|true|false)[\.、:：\s-]+(.+)$/);
          return {
            key: matched ? matched[1] : String.fromCharCode(65 + index),
            text: matched ? matched[2].trim() : trimmed,
          };
        }
        return null;
      })
      .filter((item): item is { key: string; text: string } => Boolean(item));
  }

  if (typeof input === 'string') {
    const parsed = safeJsonParse<unknown>(input);
    if (parsed) {
      return normalizeOptions(parsed, type);
    }

    return input
      .split(/\r?\n+/)
      .map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const matched = trimmed.match(/^([A-Za-z]|true|false)[\.、:：\s-]+(.+)$/);
        return {
          key: matched ? matched[1] : String.fromCharCode(65 + index),
          text: matched ? matched[2].trim() : trimmed,
        };
      })
      .filter((item): item is { key: string; text: string } => Boolean(item));
  }

  return [];
}

function normalizeAnswer(input: unknown, type: PracticeQuestion['type']) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    const parsed = safeJsonParse<unknown>(input);
    if (parsed) {
      return normalizeAnswer(parsed, type);
    }

    const raw = input.trim();
    if (!raw) return [];

    if (type === 'judge') {
      const judgeMap: Record<string, string> = {
        正确: 'true',
        对: 'true',
        true: 'true',
        错误: 'false',
        错: 'false',
        false: 'false',
      };
      const normalized = judgeMap[raw.toLowerCase()] ?? judgeMap[raw] ?? raw;
      return [normalized];
    }

    if (raw.includes(',') || raw.includes('，') || raw.includes('|') || raw.includes('/')) {
      return raw
        .split(/[,，|/]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (/^[A-Za-z]+$/.test(raw) && raw.length > 1) {
      return raw.split('').map((item) => item.trim()).filter(Boolean);
    }

    return [raw];
  }

  return [];
}

function normalizeTags(textValue: unknown, fieldValue: unknown) {
  const textTags = typeof textValue === 'string'
    ? textValue
        .split(/[\n,，|/；;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const fieldTags = Array.isArray(fieldValue)
    ? fieldValue
        .map((item) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            return String(obj.name ?? obj.text ?? obj.value ?? '').trim();
          }
          return String(item ?? '').trim();
        })
        .filter(Boolean)
    : typeof fieldValue === 'string'
      ? fieldValue
          .split(/[\n,，|/；;]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return Array.from(new Set([...textTags, ...fieldTags]));
}

function mapRecordToPracticeQuestion(record: FeishuRecord): PracticeQuestion | null {
  const fields = record.fields ?? {};
  if (fields['记录类型'] && fields['记录类型'] !== 'question') {
    return null;
  }

  const stem = String(getFieldValue(fields, QUESTION_FIELD_ALIASES.stem) ?? '').trim();
  if (!stem) {
    return null;
  }

  const type = normalizeQuestionType(getFieldValue(fields, QUESTION_FIELD_ALIASES.type));
  const optionsJson = normalizeOptions(getFieldValue(fields, QUESTION_FIELD_ALIASES.options), type);
  const answerJson = normalizeAnswer(getFieldValue(fields, QUESTION_FIELD_ALIASES.answer), type);
  const analysis = String(getFieldValue(fields, QUESTION_FIELD_ALIASES.analysis) ?? '').trim() || undefined;
  const difficulty = normalizeDifficulty(getFieldValue(fields, QUESTION_FIELD_ALIASES.difficulty));
  const tags = normalizeTags(
    getFieldValue(fields, QUESTION_FIELD_ALIASES.tagsText),
    getFieldValue(fields, QUESTION_FIELD_ALIASES.tags),
  );

  return {
    id: String(fields['题目ID'] || record.record_id),
    type,
    stem,
    optionsJson,
    answerJson,
    analysis,
    tags,
    difficulty,
  };
}

async function getTenantAccessToken() {
  const { appId, appSecret } = getRequiredConfig();
  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID/FEISHU_BASE_APP_ID or FEISHU_APP_SECRET/FEISHU_BASE_APP_SECRET');
  }

  const res = await fetch(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    cache: 'no-store',
  });

  const data = (await res.json()) as FeishuTokenResponse;
  if (!res.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(data.msg || 'Failed to get Feishu tenant access token');
  }
  return data.tenant_access_token as string;
}

async function fetchBitableRecords(): Promise<FeishuRecord[]> {
  const { appToken, tableId } = getRequiredConfig();
  if (!appToken || !tableId) {
    return [];
  }

  const token = await getTenantAccessToken();
  const items: FeishuRecord[] = [];
  let pageToken = '';
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${FEISHU_BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '500');
    if (pageToken) {
      url.searchParams.set('page_token', pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = (await res.json()) as FeishuListResponse;
    if (!res.ok || data.code !== 0) {
      throw new Error(data.msg || 'Failed to fetch bitable records');
    }

    const batch = data.data?.items || [];
    items.push(...batch);
    hasMore = Boolean(data.data?.has_more);
    pageToken = data.data?.page_token || '';
  }

  return items;
}

function getDemoQuestions(): PracticeQuestion[] {
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

export async function listQuestionsFromBitable(): Promise<PracticeQuestion[]> {
  const { appToken, tableId, appId, appSecret } = getRequiredConfig();
  if (!appToken || !tableId) {
    return [];
  }

  if (!appId || !appSecret) {
    return getDemoQuestions();
  }

  const records = await fetchBitableRecords();
  return records
    .map(mapRecordToPracticeQuestion)
    .filter((item): item is PracticeQuestion => Boolean(item));
}

export async function createAttemptRecord(input: {
  questionId: string;
  stem: string;
  userAnswerJson: string[];
  isCorrect: boolean;
  tags?: string[];
}) {
  const { appToken, tableId } = getRequiredConfig();
  const token = await getTenantAccessToken();
  const res = await fetch(
    `${FEISHU_BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          文本: `attempt-${input.questionId}-${Date.now()}`,
          记录类型: 'attempt',
          题目ID: input.questionId,
          题干: input.stem,
          用户答案JSON: JSON.stringify(input.userAnswerJson),
          是否正确: input.isCorrect,
          作答时间: Date.now(),
          标签: input.tags || [],
          最后状态: input.isCorrect ? 'correct' : 'wrong',
        },
      }),
    },
  );

  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg || 'Failed to create attempt record');
  }

  return data.data?.record;
}

export async function listAttemptRecords(): Promise<AttemptRecord[]> {
  const records = await fetchBitableRecords();
  return records
    .filter((item) => (item.fields || {})['记录类型'] === 'attempt')
    .map((item) => {
      const f = item.fields || {};
      return {
        id: item.record_id,
        questionId: String(f['题目ID'] || ''),
        stem: String(f['题干'] || ''),
        isCorrect: Boolean(f['是否正确']),
        tags: normalizeTags(f['标签文本'], f['标签']),
        answeredAt: f['作答时间'] ? String(f['作答时间']) : undefined,
      } as AttemptRecord;
    });
}

export async function listWrongRecords(): Promise<WrongRecord[]> {
  const records = await fetchBitableRecords();
  return records
    .filter((item) => (item.fields || {})['记录类型'] === 'wrong')
    .map((item) => {
      const f = item.fields || {};
      return {
        id: item.record_id,
        questionId: String(f['题目ID'] || ''),
        stem: String(f['题干'] || ''),
        wrongCount: Number(f['错题次数'] || 1),
        lastStatus: String(f['最后状态'] || 'wrong'),
        tags: normalizeTags(f['标签文本'], f['标签']),
        updatedAt: f['作答时间'] ? String(f['作答时间']) : undefined,
      } as WrongRecord;
    });
}

export async function upsertWrongRecord(input: {
  questionId: string;
  stem: string;
  tags?: string[];
  isCorrect: boolean;
}) {
  const { appToken, tableId } = getRequiredConfig();
  const token = await getTenantAccessToken();
  const existing = await listWrongRecords();
  const matched = existing.find((item) => item.questionId === input.questionId);

  if (input.isCorrect) {
    if (!matched) return null;
    const res = await fetch(
      `${FEISHU_BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${matched.id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            最后状态: 'correct',
            作答时间: Date.now(),
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      throw new Error(data.msg || 'Failed to update wrong record');
    }
    return data.data?.record;
  }

  if (matched) {
    const res = await fetch(
      `${FEISHU_BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${matched.id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            错题次数: matched.wrongCount + 1,
            最后状态: 'wrong',
            作答时间: Date.now(),
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      throw new Error(data.msg || 'Failed to update wrong record');
    }
    return data.data?.record;
  }

  const res = await fetch(
    `${FEISHU_BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          文本: `wrong-${input.questionId}`,
          记录类型: 'wrong',
          题目ID: input.questionId,
          题干: input.stem,
          标签: input.tags || [],
          错题次数: 1,
          最后状态: 'wrong',
          作答时间: Date.now(),
        },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg || 'Failed to create wrong record');
  }
  return data.data?.record;
}
