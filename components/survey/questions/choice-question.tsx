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
      {/* Question Tag */}
      <div className="text-xs font-bold text-[#2ecfaa] tracking-wide mb-1 uppercase">שאלה</div>
      
      {/* Question Text */}
      <h2 className="text-lg font-bold text-[#1e1c4a] leading-relaxed mb-4">
        {question.questionText}
      </h2>
      
      {/* Choice List */}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-3 bg-white border rounded-xl p-3 text-right transition-all ${
              value === option.value
                ? 'border-[#2ecfaa] bg-[#e4faf5]'
                : 'border-[#e8e7f5] hover:border-[#2ecfaa] hover:bg-[#e4faf5]'
            }`}
          >
            {/* Radio indicator */}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
              value === option.value
                ? 'border-[#2ecfaa] bg-[#2ecfaa]'
                : 'border-[#e8e7f5]'
            }`}>
              {value === option.value && (
                <span className="text-white text-xs">✓</span>
              )}
            </div>
            
            {/* Option content */}
            <span className={`flex-1 text-sm ${
              value === option.value ? 'text-[#1e1c4a] font-semibold' : 'text-[#6b6890]'
            }`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
