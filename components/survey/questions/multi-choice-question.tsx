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
      {/* Question Tag */}
      <div className="text-xs font-bold text-[#2ecfaa] tracking-wide mb-1 uppercase">שאלה</div>
      
      {/* Question Text */}
      <h2 className="text-lg font-bold text-[#1e1c4a] leading-relaxed mb-1">
        {question.questionText}
      </h2>
      <p className="text-xs text-[#a8a6c4] mb-4">
        ניתן לבחור יותר מאפשרות אחת
      </p>
      
      {/* Multi-Choice Grid */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = values.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggleValue(option.value)}
              className={`bg-white border rounded-xl p-3 text-center transition-all ${
                isSelected
                  ? 'border-[#2ecfaa] bg-[#e4faf5] shadow-sm'
                  : 'border-[#e8e7f5] hover:border-[#2ecfaa] hover:bg-[#e4faf5]'
              }`}
            >
              {option.emoji && (
                <span className="text-xl block mb-1">{option.emoji}</span>
              )}
              <span className={`text-sm font-medium block ${
                isSelected ? 'text-[#3d3a9e] font-semibold' : 'text-[#6b6890]'
              }`}>
                {option.label}
              </span>
              
              {/* Check indicator */}
              {isSelected && (
                <span className="text-xs text-[#2ecfaa] mt-1 block">✓</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
