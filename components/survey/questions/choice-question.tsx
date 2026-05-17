'use client'

import type { Question } from '@/lib/types'

interface ChoiceQuestionProps {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

export function ChoiceQuestion({ question, value, onChange }: ChoiceQuestionProps) {
  const options = question.options || []

  return (
    <div>
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      <h2 className="text-xl font-bold text-white leading-relaxed mb-6">{question.questionText}</h2>
      
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`survey-option-btn flex items-center gap-4 text-right ${value === option.value ? 'survey-option-btn-active' : ''}`}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${value === option.value ? 'border-primary bg-primary' : 'border-border bg-input'}`}>
              {value === option.value && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className={`flex-1 text-base font-semibold ${value === option.value ? 'text-primary' : 'text-muted-foreground'}`}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
