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
  const options = [...(question.options || defaultOptions)].sort((a, b) => Number(b.value) - Number(a.value))

  return (
    <div>
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      <h2 className="text-xl font-bold text-white leading-relaxed mb-6">{question.questionText}</h2>
      
      <div className="grid grid-cols-2 gap-3" dir="rtl">
        {options.map((option) => (
    <button
  key={option.value}
  onClick={() => onChange(option.value)}
  className={`w-full rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-95 shadow-sm border-2 flex flex-col items-center text-center ${
    value === option.value 
      ? 'border-[#2a7c7c] bg-[#e6f2f2] text-[#2a7c7c] scale-[1.02]' 
      : 'border-transparent bg-white text-[#1e1c4a] hover:bg-[#f7f7fc]'
  }`}
>
  <span className="text-4xl block mb-2" role="img" aria-label={option.label}>{option.emoji}</span>
  <span className={`text-base font-semibold ${value === option.value ? 'text-[#2a7c7c]' : 'text-muted-foreground'}`}>{option.label}</span>
</button>
        ))}
      </div>
    </div>
  )
}
