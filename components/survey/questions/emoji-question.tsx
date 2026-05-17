'use client'

import type { Question, QuestionOption } from '@/lib/types'

interface EmojiQuestionProps {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

const defaultOptions: QuestionOption[] = [
  { value: '5', label: 'מעולה', emoji: '😍' },
  { value: '4', label: 'טוב', emoji: '😊' },
  { value: '3', label: 'בסדר', emoji: '😐' },
  { value: '2', label: 'לא טוב', emoji: '😟' },
  { value: '1', label: 'גרוע מאוד', emoji: '😡' },
]

export function EmojiQuestion({ question, value, onChange }: EmojiQuestionProps) {
  // Sort options from highest (5) to lowest (1)
  const options = [...(question.options || defaultOptions)].sort((a, b) => Number(b.value) - Number(a.value))

  return (
    <div>
      <div className="text-xs font-bold text-[#2a7c7c] tracking-wide mb-1 uppercase">שאלה</div>
      {/* Main question changed to full white text to contrast nicely with the deep navy background */}
      <h2 className="text-xl font-bold text-white leading-relaxed mb-6">
        {question.questionText}
      </h2>
      
      <div className="grid grid-cols-2 gap-3" dir="rtl">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`bg-white border rounded-2xl p-4 text-center transition-all shadow-sm cursor-pointer ${
              value === option.value
                ? 'border-[#2a7c7c] bg-[#f0f9f9] scale-[1.02] shadow-md'
                : 'border-[#e8e7f5] text-[#1e1c4a] hover:bg-[#f7f7fc] hover:border-[#a8a6c4]'
            }`}
          >
            <span className="text-3xl block mb-2" role="img" aria-label={option.label}>
              {option.emoji}
            </span>
            <span className={`text-base ${
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
