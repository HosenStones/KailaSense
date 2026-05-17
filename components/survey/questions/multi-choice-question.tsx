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
      <div className="text-xs font-bold text-[#2a7c7c] tracking-wide mb-1 uppercase">שאלה</div>
      
      <h2 className="text-xl font-bold text-white leading-relaxed mb-1">
        {question.questionText}
      </h2>
      <p className="text-xs text-[#a8a6c4] mb-5 font-medium">
        ניתן לבחור יותר מאפשרות אחת
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = values.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggleValue(option.value)}
              className={`bg-white border rounded-2xl p-4 text-center transition-all shadow-sm cursor-pointer ${
                isSelected
                  ? 'border-[#2a7c7c] bg-[#f0f9f9] shadow-md scale-[1.02]'
                  : 'border-[#e8e7f5] text-[#1e1c4a] hover:bg-[#f7f7fc] hover:border-[#a8a6c4]'
              }`}
            >
              {option.emoji && (
                <span className="text-2xl block mb-2">{option.emoji}</span>
              )}
              <span className={`text-base ${
                isSelected ? 'text-[#2a7c7c] font-bold' : 'text-[#6b6890] font-semibold'
              }`}>
                {option.label}
              </span>
              
              {isSelected && (
                <span className="text-xs text-[#2a7c7c] mt-2 block font-bold">✓ נבחר</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
