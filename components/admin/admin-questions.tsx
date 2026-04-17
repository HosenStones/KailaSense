'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AdminQuestionsProps {
  departmentId: string
}

interface Question {
  id: string
  text: string
  type: 'emoji' | 'choice' | 'multi_choice' | 'stars' | 'open_text'
  source: 'fixed' | 'custom' | 'ai'
}

export function AdminQuestions({ departmentId }: AdminQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: 'איך היית מדרג/ת את החוויה הכללית שלך במחלקה?', type: 'emoji', source: 'fixed' },
    { id: '2', text: 'האם הצוות הרפואי התייחס אליך בכבוד ובאדיבות?', type: 'emoji', source: 'fixed' },
    { id: '3', text: 'האם קיבלת הסברים מספקים על הטיפול והתרופות?', type: 'choice', source: 'fixed' },
    { id: '4', text: 'אילו שירותים היו לשביעות רצונך המלאה?', type: 'multi_choice', source: 'custom' },
    { id: '5', text: 'כמה כוכבים היית נותן/ת למחלקה?', type: 'stars', source: 'fixed' },
    { id: '6', text: 'יש לך הערות או הצעות לשיפור?', type: 'open_text', source: 'ai' },
  ])

  const typeLabels: Record<string, string> = {
    emoji: 'אמוג\'י',
    choice: 'בחירה',
    multi_choice: 'רב-בחירה',
    stars: 'כוכבים',
    open_text: 'טקסט פתוח',
  }

  const handleDelete = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1e1c4a]">ניהול שאלות - {departmentId === 'cardiology' ? 'קרדיולוגיה' : 'מחלקה'}</h3>
        <div className="flex gap-2">
          <Button className="bg-[#2ecfaa] hover:bg-[#26b896] text-[#1e4a40] text-sm font-semibold px-4 py-2 h-auto rounded-lg">
            + שאלה חדשה עם AI
          </Button>
          <Button className="bg-[#3d3a9e] hover:bg-[#302d8a] text-white text-sm font-semibold px-4 py-2 h-auto rounded-lg">
            + הוסף שאלה
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-xl p-4 border border-[#e8e7f5] flex items-center gap-3"
          >
            <span className="text-[#e8e7f5] cursor-grab">⋮⋮</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1e1c4a] mb-1">{question.text}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    question.source === 'fixed'
                      ? 'bg-[#eeedf9] text-[#3d3a9e]'
                      : question.source === 'custom'
                      ? 'bg-[#e4faf5] text-[#0a5c4a]'
                      : 'bg-[#fde8f2] text-[#8a0040]'
                  }`}
                >
                  {question.source === 'fixed' ? 'קבועה' : question.source === 'custom' ? 'מותאמת' : 'AI'}
                </span>
                <span className="text-xs text-[#a8a6c4]">{typeLabels[question.type]}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-2 bg-[#f7f7fc] border border-[#e8e7f5] rounded-lg text-sm hover:bg-[#e8e7f5]">
                ✏️
              </button>
              <button
                onClick={() => handleDelete(question.id)}
                className="p-2 bg-[#f7f7fc] border border-[#e8e7f5] rounded-lg text-sm hover:bg-[#fde8f2]"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {/* Add Question Placeholder */}
        <div className="border-2 border-dashed border-[#e8e7f5] rounded-xl p-4 text-center cursor-pointer text-[#a8a6c4] text-sm font-semibold hover:bg-[#e4faf5] hover:border-[#2ecfaa] hover:text-[#3d3a9e] transition-colors">
          + לחץ להוספת שאלה חדשה
        </div>
      </div>
    </div>
  )
}
