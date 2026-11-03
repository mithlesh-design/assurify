import { cloneElement, isValidElement, useId } from 'react';
import {
  isRopaBoolean,
  isRopaMultiSelect,
  isRopaText,
  normalizeRopaSection,
  questionsForSections,
  ropaQuestionOptions,
  ROPA_SECTION_LABELS,
} from '../data/ropaQuestions';

function MultiSelectField({ options, selected = [], onChange }) {
  const values = Array.isArray(selected) ? selected : [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(option => {
        const active = values.includes(option);
        return (
          <button key={option} type="button" aria-pressed={active}
            onClick={() => onChange(active ? values.filter(value => value !== option) : [...values, option])}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontWeight: active ? 700 : 500,
              background: active ? 'var(--green-soft)' : 'var(--surface)',
              color: active ? 'var(--green-dim)' : 'var(--ink2)',
              border: `1px solid ${active ? 'var(--green-mid)' : 'var(--border)'}`, minHeight: 32,
            }}>
            {option.replaceAll('_', ' ')}
          </button>
        );
      })}
    </div>
  );
}

function QuestionField({ question, value, onChange }) {
  const fieldId = useId();
  const options = ropaQuestionOptions(question);
  const label = question.display_text || question.field_name;
  const inputStyle = { width: '100%', boxSizing: 'border-box' };
  const normalizedValue = value ?? '';

  let input;
  if (isRopaMultiSelect(question)) {
    input = <MultiSelectField options={options} selected={normalizedValue} onChange={onChange} />;
  } else if (isRopaBoolean(question)) {
    input = (
      <select className="input" style={inputStyle} value={normalizedValue === '' ? '' : normalizedValue ? 'true' : 'false'}
        onChange={event => onChange(event.target.value === 'true')}>
        <option value="">Select…</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  } else if (options.length) {
    input = (
      <select className="input" style={inputStyle} value={normalizedValue} onChange={event => onChange(event.target.value)}>
        <option value="">Select…</option>
        {options.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
      </select>
    );
  } else if (isRopaText(question)) {
    input = (
      <textarea className="input" style={{ ...inputStyle, resize: 'vertical' }} rows={2}
        value={normalizedValue} onChange={event => onChange(event.target.value)} />
    );
  } else {
    input = (
      <input className="input" style={inputStyle}
        type={question.answer_type === 'number' ? 'number' : question.answer_type === 'date' ? 'date' : 'text'}
        value={normalizedValue}
        onChange={event => onChange(question.answer_type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)} />
    );
  }

  const multi = isRopaMultiSelect(question);
  const control = isValidElement(input) && !multi
    ? cloneElement(input, { id: fieldId, 'aria-describedby': question.question ? `${fieldId}-hint` : undefined, 'aria-required': question.is_required || undefined })
    : input;
  return (
    <div style={{ marginBottom: 14, minWidth: 0, gridColumn: isRopaText(question) || multi ? '1 / -1' : undefined }}
      role={multi ? 'group' : undefined} aria-labelledby={multi ? `${fieldId}-label` : undefined}>
      <label className="field-label" id={`${fieldId}-label`} htmlFor={multi ? undefined : fieldId}>
        {label}{question.is_required && <span className="field-required" aria-hidden="true">*</span>}
      </label>
      {question.question && <div className="field-hint" id={`${fieldId}-hint`} style={{ marginTop: 0, marginBottom: 6 }}>{question.question}</div>}
      {control}
    </div>
  );
}

export default function RopaQuestionFields({ questions, sections, values, onChange, grouped = false }) {
  const selectedQuestions = questionsForSections(questions, sections);
  const sectionKeys = [...new Set(selectedQuestions.map(question => normalizeRopaSection(question.section)))];
  const groups = grouped
    ? sectionKeys.map(section => ({
      section,
      questions: selectedQuestions.filter(question => normalizeRopaSection(question.section) === section),
    }))
    : [{ section: null, questions: selectedQuestions }];

  return groups.map(group => (
    <div key={group.section ?? 'questions'} style={grouped ? {
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--r-md)',
      padding: '14px 16px 2px',
      marginBottom: 14,
      background: 'var(--white)',
    } : undefined}>
      {group.section && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
          {ROPA_SECTION_LABELS[group.section] ?? group.section}
        </div>
      )}
      <div className="form-grid" style={{ gap: '0 12px' }}>
        {group.questions.map(question => (
          <QuestionField key={question.id ?? question.field_name} question={question}
            value={values[question.field_name]}
            onChange={value => onChange(question.field_name, value)} />
        ))}
      </div>
    </div>
  ));
}
