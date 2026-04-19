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
  // אנחנו לוקחים את האופציות וממיינים אותן מהגבוה (5) לנמוך (1)
  const options = [...(question.options || defaultOptions)].sort((a, b) => Number(b.value) - Number(a.value))

  return (
    <div>
      <div className="text-xs font-bold text-[#2ecfaa] tracking-wide mb-1 uppercase">שאלה</div>
      <h2 className="text-lg font-bold text-[#1e1c4a] leading-relaxed mb-4">
        {question.questionText}
      </h2>
      
      <div className="grid grid-cols-2 gap-2" dir="rtl"> {/* הוספת dir="rtl" מבטיח שהסדר נכון */}
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`bg-white border rounded-xl p-4 text-center transition-all ${
              value === option.value
                ? 'border-[#2ecfaa] bg-[#e4faf5] shadow-md'
                : 'border-[#e8e7f5] hover:border-[#2ecfaa] hover:bg-[#e4faf5]'
            }`}
          >
            <span className="text-2xl block mb-1" role="img" aria-label={option.label}>
              {option.emoji}
            </span>
            <span className={`text-sm font-medium ${
              value === option.value ? 'text-[#3d3a9e] font-bold' : 'text-[#6b6890]'
            }`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
