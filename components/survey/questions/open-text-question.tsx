'use client'

import type { Question } from '@/lib/types'

interface OpenTextQuestionProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

export function OpenTextQuestion({ question, value, onChange }: OpenTextQuestionProps) {
  const maxLength = 500
  
  return (
    <div>
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      <h2 className="text-xl font-bold text-white leading-relaxed mb-4">{question.questionText}</h2>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="כתוב כאן את המשוב שלך..."
        className="w-full min-h-[120px] p-4 border border-border rounded-2xl text-base text-card-foreground leading-relaxed resize-none bg-card outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted-foreground/50 shadow-sm"
        dir="rtl"
      />
      
      <div className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
        {value.length} / {maxLength}
      </div>
    </div>
  )
}
