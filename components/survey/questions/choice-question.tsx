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
      <div className="text-xs font-bold text-[#2a7c7c] tracking-wide mb-1 uppercase">שאלה</div>
      
      <h2 className="text-xl font-bold text-white leading-relaxed mb-6">
        {question.questionText}
      </h2>
      
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-4 bg-white border rounded-2xl p-4 text-right transition-all shadow-sm cursor-pointer ${
              value === option.value
                ? 'border-[#2a7c7c] bg-[#f0f9f9] shadow-md scale-[1.01]'
                : 'border-[#e8e7f5] text-[#1e1c4a] hover:bg-[#f7f7fc] hover:border-[#a8a6c4]'
            }`}
          >
            {/* Custom choice indicator matching Insights layout */}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
              value === option.value
                ? 'border-[#2a7c7c] bg-[#2a7c7c]'
                : 'border-[#e8e7f5] bg-[#f7f7fc]'
            }`}>
              {value === option.value && (
                <span className="text-white text-xs font-bold">✓</span>
              )}
            </div>
            
            <span className={`flex-1 text-base ${
              value === option.value ? 'text-[#2a7c7c] font-bold' : 'text-[#6b6890] font-semibold'
            }`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
