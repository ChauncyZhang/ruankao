export type OptionItem = { key: string; text: string };

export type PracticeQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'judge'
  | 'short_answer'
  | 'case_analysis';

export type PracticeQuestion = {
  id: string;
  type: PracticeQuestionType;
  stem: string;
  optionsJson: OptionItem[];
  answerJson: string[];
  analysis?: string;
  tags: string[];
  difficulty: number;
};

export type WrongRecord = {
  id: string;
  questionId: string;
  stem: string;
  wrongCount: number;
  lastStatus: string;
  tags: string[];
  updatedAt?: string;
};

export type AttemptRecord = {
  id: string;
  questionId: string;
  stem: string;
  isCorrect: boolean;
  tags: string[];
  answeredAt?: string;
};
