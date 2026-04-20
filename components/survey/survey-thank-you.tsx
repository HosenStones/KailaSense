'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getDepartmentStats } from '@/lib/firebase/firestore'
import { ChevronDown, ChevronUp, Star } from 'lucide-react'

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

  useEffect(() => {
    async function loadStats() {
      if (departmentId) {
        const realStats = await getDepartmentStats(departmentId)
        setStats(realStats)
      }
    }
    loadStats()
  }, [departmentId])

  const getEmoji = (val: string) => {
    const map: Record<string, string> = { '1': '😡', '2': '😟', '3': '😐', '4': '😊', '5': '😍' };
    return map[val] || val;
  }

  const renderStars = (val: string) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-5 h-5 ${star <= num ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-[#e8e7f5] shadow-xl animate-in fade-in zoom-in duration-500">
        
        <Image src="/images/kaila-logo-vertical.png" alt="Kaila" width={120} height={80} className="mx-auto mb-6 h-14 w-auto" priority />
        
        <h2 className="text-3xl font-bold text-[#1e1c4a] mb-2">
          תודה רבה! 🙏
        </h2>
        <p className="text-[#6b6890] mb-8 leading-relaxed text-lg">
          המשוב שלך התקבל בהצלחה ויעזור לצוות <b>{departmentName}</b> להמשיך להשתפר.
        </p>

        {/* Real Stats Display */}
        <div className="bg-[#f7f7fc] rounded-2xl p-6 mb-6 border border-[#e8e7f5]">
          <h3 className="text-sm font-bold text-[#1a5c5c] mb-4 uppercase tracking-wide">ההשפעה של המשוב שלך</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center shadow-sm">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.satisfactionPercentage}%</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">שביעות רצון</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center shadow-sm">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalResponses}</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">משיבים</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e8e7f5] flex flex-col items-center justify-center shadow-sm">
              <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalComments}+</div>
              <div className="text-[10px] text-[#6b6890] mt-1 font-bold text-center">תגובות</div>
            </div>
          </div>
        </div>

        {/* Reassuring Text (Moved below stats, colored gray) */}
        <div className="text-[#6b6890] mb-8 font-medium text-[13px] space-y-1">
          <p>אנחנו קוראים כל תגובה ומתייחסים.</p>
          <p>תודה שעזרת לנו להשתפר 🌟</p>
        </div>

        {/* Show/Hide Answers Toggle */}
        <div className="mb-8 text-right">
          <button 
            onClick={() => setShowAnswers(!showAnswers)} 
            className="flex items-center justify-between w-full bg-[#f0f9f9] p-4 rounded-xl text-[#1a5c5c] font-bold text-sm border border-[#2a7c7c]/20 hover:bg-[#e6f4f4] transition-colors"
          >
            <span>{showAnswers ? 'הסתר את התשובות שלי' : 'צפה בתשובות'}</span>
            {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAnswers && (
            <div className="mt-4 space-y-3 text-sm animate-in slide-in-from-top-2">
              {questions.map((q: any) => {
                const r = responses[q.id];
                if (!r || (!r.answerValue && !r.answerText && (!r.answerValues || r.answerValues.length === 0))) return null;
                return (
                  <div key={q.id} className="bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm text-right">
                    <p className="font-bold text-[#1e1c4a] mb-3 leading-snug">{q.questionText}</p>
                    <div className="text-[#2a7c7c] font-medium flex items-center">
                      {q.questionType === 'emoji' ? <span className="text-2xl">{getEmoji(r.answerValue)}</span> :
                       q.questionType === 'stars' ? renderStars(r.answerValue) :
                       q.questionType === 'multi_choice' ? <span className="text-sm bg-[#f0f9f9] px-3 py-1.5 rounded-lg">{r.answerValues?.join(', ')}</span> :
                       <span className="text-sm bg-[#f0f9f9] px-3 py-1.5 rounded-lg block w-full">{r.answerText || r.answerValue}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
