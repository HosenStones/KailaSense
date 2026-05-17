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
      {/* Question Tag */}
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      
      {/* Question Text */}
      <h2 className="text-lg font-bold text-card-foreground leading-relaxed mb-4">
        {question.questionText}
      </h2>
      
      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="כתוב כאן את המשוב שלך..."
        className="w-full min-h-[100px] p-3 border border-border rounded-xl text-sm text-foreground leading-relaxed resize-none bg-background outline-none focus:border-primary"
        dir="rtl"
      />
      
      {/* Character count */}
      <div className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
        {value.length} / {maxLength}
      </div>
    </div>
  )
}
