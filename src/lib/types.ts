export type OptionItem = { key: string; text: string };

export type PracticeQuestion = {
  id: string;
  type: string;
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
