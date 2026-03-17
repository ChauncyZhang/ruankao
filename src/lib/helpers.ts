export function normalizeAnswer(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).sort();
  return [String(input)].sort();
}

export function isAnswerCorrect(userAnswer: unknown, correctAnswer: unknown) {
  return JSON.stringify(normalizeAnswer(userAnswer)) === JSON.stringify(normalizeAnswer(correctAnswer));
}

export function formatQuestionType(type: string) {
  const map: Record<string, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    judge: '判断题',
    short_answer: '简答题',
    case_analysis: '案例题',
  };
  return map[type] ?? type;
}
