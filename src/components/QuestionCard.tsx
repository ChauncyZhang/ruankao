import { formatQuestionType } from '@/lib/helpers';
import { PracticeQuestion } from '@/lib/types';

export function QuestionCard({ question, selected, onChange, showResult }: { question: PracticeQuestion; selected: string[]; onChange: (v: string[]) => void; showResult?: boolean }) {
  const isMultiple = question.type === 'multiple_choice';

  return (
    <div className="card">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <span className="badge">{formatQuestionType(question.type)}</span>
        <span className="muted">难度：{question.difficulty}</span>
      </div>
      <h2 style={{ marginTop: 16 }}>{question.stem}</h2>
      <div className="question-options">
        {question.optionsJson.map((option) => {
          const checked = selected.includes(option.key);
          return (
            <label key={option.key} className="option">
              <input
                type={isMultiple ? 'checkbox' : 'radio'}
                checked={checked}
                name={`question-${question.id}`}
                onChange={() => {
                  if (isMultiple) {
                    onChange(checked ? selected.filter((item) => item !== option.key) : [...selected, option.key]);
                  } else {
                    onChange([option.key]);
                  }
                }}
              />
              <div><strong>{option.key}.</strong> {option.text}</div>
            </label>
          );
        })}
      </div>
      {showResult ? (
        <div className="card" style={{ background: '#fafafa' }}>
          <div><strong>正确答案：</strong>{question.answerJson.join(', ')}</div>
          <div style={{ marginTop: 8 }}><strong>解析：</strong>{question.analysis || '暂无解析'}</div>
        </div>
      ) : null}
    </div>
  );
}
