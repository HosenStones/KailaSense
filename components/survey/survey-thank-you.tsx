'use client'

import { Button } from '@/components/ui/button'
import type { Question, Response } from '@/lib/types'
import { CheckCircle2, Home } from 'lucide-react'

interface SurveyThankYouProps {
  departmentName: string
  departmentId: string
  onRestart: () => void
  responses: Record<string, Partial<Response>>
  questions: Question[]
}

export function SurveyThankYou({ departmentName, onRestart, responses, questions }: SurveyThankYouProps) {
  // Filter out informational content slides from the summary display
  const activeQuestionsOnly = questions.filter(q => q.questionType !== 'content')

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 md:p-6 text-center" dir="rtl">
      <div className="bg-white max-w-xl w-full rounded-3xl p-6 md:p-10 border border-[#e8e7f5] shadow-xl space-y-6 animate-in fade-in zoom-in duration-500">
        
        {/* Success Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4f4] text-[#2a7c7c]">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1e1c4a]">תודה רבה!</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
            תודה רבה על השתתפותך במשוב! התשובות שלך יסייעו לנו לשפר את השירות במחלקת <span className="font-bold text-[#2a7c7c]">{departmentName}</span>.
          </p>
        </div>

        {/* Responses Summary Table */}
        {activeQuestionsOnly.length > 0 && (
          <div className="border border-[#e8e7f5] rounded-2xl overflow-hidden bg-[#f7f7fc] text-right">
            <div className="bg-[#2a7c7c]/10 px-4 py-3 border-b border-[#e8e7f5]">
              <h3 className="font-bold text-[#2a7c7c] text-sm">סיכום התשובות שנקלטו במערכת:</h3>
            </div>
            <div className="divide-y divide-[#e8e7f5] max-h-60 overflow-y-auto">
              {activeQuestionsOnly.map((q, index) => {
                const resp = responses[q.id]
                let displayAnswer = 'לא נענה'

                if (resp) {
                  if (q.questionType === 'multi_choice' && resp.answerValues) {
                    displayAnswer = resp.answerValues.join(', ')
                  } else if (resp.answerValue) {
                    displayAnswer = resp.answerValue
                  } else if (resp.answerText) {
                    displayAnswer = resp.answerText
                  }
                }

                return (
                  <div key={q.id} className="p-4 flex flex-col gap-1 hover:bg-white transition-colors">
                    <span className="text-xs text-muted-foreground font-semibold">שאלה {index + 1}: {q.questionText}</span>
                    <span className="text-sm font-bold text-[#1e1c4a]">{displayAnswer}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation Action */}
        <Button 
          onClick={onRestart} 
          className="bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold h-14 rounded-2xl w-full text-base transition-all shadow-md cursor-pointer"
        >
          <Home className="ml-2 h-5 w-5" /> חזרה למסך הראשי
        </Button>
      </div>
    </div>
  )
}
