'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getDepartmentStats } from '@/lib/firebase/firestore'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SurveyThankYouProps {
  departmentName: string
  departmentId: string
  onRestart: () => void
  responses: any
  questions: any
}

export function SurveyThankYou({ departmentName, departmentId, onRestart, responses, questions }: SurveyThankYouProps) {
  const [stats, setStats] = useState({ totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 })
  const [showAnswers, setShowAnswers] = useState(false)

  // Fetch real statistics on load (same engine as admin insights)
  useEffect(() => {
    async function loadStats() {
      if (departmentId) {
        const realStats = await getDepartmentStats(departmentId)
        setStats(realStats)
      }
    }
    loadStats()
  }, [departmentId])

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-[#e8e7f5] shadow-xl animate-in fade-in zoom-in duration-500">
        
        {/* Restored Vertical Logo */}
        <Image src="/images/kaila-logo-vertical.png" alt="Kaila" width={120} height={80} className="mx-auto mb-6 h-14 w-auto" priority />
        
        <h2 className="text-3xl font-bold text-[#1e1c4a] mb-3">תודה רבה!</h2>
        <p className="text-[#6b6890] mb-3 leading-relaxed text-lg">
          המשוב שלך התקבל בהצלחה ויעזור לצוות <b>{departmentName}</b> להמשיך להשתפר.
        </p>
        
        {/* Restored reassuring text */}
        <p className="text-[#2a7c7c] mb-8 font-medium">
          אנו קוראים כל תגובה ומתייחסים אליה ברצינות.
        </p>

        {/* Real Stats Display with 3 columns */}
        <div className="bg-[#f7f7fc] rounded-2xl p-6 mb-8 border border-[#e8e7f5]">
          <h3 className="text-sm font-bold text-[#1a5c5c] mb-4 uppercase tracking-wide">ההשפעה של המשוב שלך</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.satisfactionPercentage}%</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">שביעות רצון</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalResponses}</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">משיבים</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalComments}+</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">תגובות</div>
            </div>
          </div>
        </div>

        {/* Restored Show/Hide Answers Toggle */}
        <div className="mb-8 text-right">
          <button 
            onClick={() => setShowAnswers(!showAnswers)} 
            className="flex items-center justify-between w-full bg-[#f0f9f9] p-4 rounded-xl text-[#1a5c5c] font-bold text-sm border border-[#2a7c7c]/20 hover:bg-[#e6f4f4] transition-colors"
          >
            <span>{showAnswers ? 'הסתר את התשובות שלי' : 'צפה בתשובות שמסרת'}</span>
            {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAnswers && (
            <div className="mt-4 space-y-3 text-sm animate-in slide-in-from-top-2">
              {questions.map((q: any) => {
                const r = responses[q.id];
                if (!r || (!r.answerValue && !r.answerText && (!r.answerValues || r.answerValues.length === 0))) return null;
                return (
                  <div key={q.id} className="bg-[#f7f7fc] p-4 rounded-xl border border-[#e8e7f5]">
                    <p className="font-bold text-[#1e1c4a] mb-2 leading-snug">{q.questionText}</p>
                    <p className="text-[#2a7c7c] font-medium">
                      {q.questionType === 'emoji' || q.questionType === 'stars' ? `${r.answerValue} מתוך 5` :
                       q.questionType === 'multi_choice' ? r.answerValues?.join(', ') :
                       r.answerText || r.answerValue}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Restored new survey button */}
        <button 
          onClick={onRestart}
          className="bg-[#2a7c7c] hover:bg-[#236969] text-white px-6 py-4 rounded-xl font-bold w-full transition-all shadow-md"
        >
          מילוי סקר חדש
        </button>
      </div>
    </div>
  )
}
