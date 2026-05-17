'use client'

import type { Question } from '@/lib/types'

interface MultiChoiceQuestionProps {
  question: Question
  values: string[]
  onChange: (values: string[]) => void
}

export function MultiChoiceQuestion({ question, values, onChange }: MultiChoiceQuestionProps) {
  const options = question.options || []

  const toggleValue = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue))
    } else {
      onChange([...values, optionValue])
    }
  }

  return (
    <div>
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      <h2 className="text-xl font-bold text-white leading-relaxed mb-1">{question.questionText}</h2>
      <p className="text-xs text-white/60 mb-5 font-medium">ניתן לבחור יותר מאפשרות אחת</p>
      
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = values.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggleValue(option.value)}
              className={`survey-option-btn ${isSelected ? 'survey-option-btn-active' : ''}`}
            >
              {option.emoji && <span className="text-2xl block mb-2">{option.emoji}</span>}
              <span className={`text-base font-semibold block ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{option.label}</span>
              {isSelected && <span className="text-xs text-primary mt-2 block font-bold">✓ נבחר</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
