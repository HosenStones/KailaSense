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

  return (
    <div>
      {/* Question Tag */}
      <div className="text-xs font-bold text-[#2ecfaa] tracking-wide mb-1 uppercase">שאלה</div>
      
      {/* Question Text */}
      <h2 className="text-lg font-bold text-[#1e1c4a] leading-relaxed mb-6">
        {question.questionText}
      </h2>
      
      {/* Stars */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="flex items-center justify-center gap-2"
          onMouseLeave={() => setHovered(null)}
        >
          {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
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
        
        {/* Label */}
        <div className="h-5 mt-2">
          {displayValue > 0 && (
            <span className="text-sm font-semibold text-[#3d3a9e]">
              {labels[displayValue - 1]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
