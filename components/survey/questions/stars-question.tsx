'use client'

import { useState } from 'react'
import type { Question } from '@/lib/types'

interface StarsQuestionProps {
  question: Question
  value: number | null
  onChange: (value: number) => void
}

export function StarsQuestion({ question, value, onChange }: StarsQuestionProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxStars = 5

  const labels = ['גרוע', 'לא טוב', 'בסדר', 'טוב', 'מעולה']
  const displayValue = hovered ?? value ?? 0

  // Reverse order: 5 stars on right (first), 1 star on left (last) - RTL friendly
  const starsReversed = Array.from({ length: maxStars }, (_, i) => maxStars - i)

  return (
    <div>
      {/* Question Tag using global primary color */}
      <div className="text-xs font-bold text-primary tracking-wide mb-1 uppercase">שאלה</div>
      
      {/* Question Text in clear white to contrast with deep navy background */}
      <h2 className="text-xl font-bold text-white leading-relaxed mb-6">
        {question.questionText}
      </h2>
      
      {/* Stars container card adopting clean white theme tokens */}
      <div className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div 
          className="flex items-center justify-center gap-2"
          onMouseLeave={() => setHovered(null)}
        >
          {starsReversed.map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <span 
                className={`text-4xl transition-all ${
                  star <= displayValue 
                    ? 'opacity-100 drop-shadow-sm' 
                    : 'opacity-20 grayscale'
                }`}
              >
                {'⭐'}
              </span>
            </button>
          ))}
        </div>
        
        {/* Active Star Label using system primary token */}
        <div className="h-5 mt-2">
          {displayValue > 0 && (
            <span className="text-base font-bold text-primary animate-in fade-in duration-200">
              {labels[displayValue - 1]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
