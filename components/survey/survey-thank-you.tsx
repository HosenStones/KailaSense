'use client'

import { useEffect, useState } from 'react'
import { getDepartmentStats } from '@/lib/firebase/firestore'

interface SurveyThankYouProps {
  departmentName: string
  departmentId: string
  onRestart: () => void
  responses: any
  questions: any
}

export function SurveyThankYou({ departmentName, departmentId, onRestart }: SurveyThankYouProps) {
  const [stats, setStats] = useState({ totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 })

  // Fetch real statistics on load
  useEffect(() => {
    async function loadStats() {
      const realStats = await getDepartmentStats(departmentId)
      setStats(realStats)
    }
    loadStats()
  }, [departmentId])

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="bg-white max-w-md w-full rounded-3xl p-10 border border-[#e8e7f5] shadow-xl animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-[#f0f9f9] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🙏</span>
        </div>
        
        <h2 className="text-3xl font-bold text-[#1e1c4a] mb-3">תודה רבה!</h2>
        <p className="text-[#6b6890] mb-8 leading-relaxed text-lg">
          המשוב שלך התקבל בהצלחה ויעזור לצוות <b>{departmentName}</b> להמשיך להשתפר.
        </p>

        {/* Real Stats Display */}
        <div className="bg-[#f7f7fc] rounded-2xl p-6 mb-8 border border-[#e8e7f5]">
          <h3 className="text-sm font-bold text-[#1a5c5c] mb-4 uppercase tracking-wide">ההשפעה של המשוב שלך</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#e8e7f5]">
              <div className="text-2xl font-bold text-[#2a7c7c]">{stats.satisfactionPercentage}%</div>
              <div className="text-xs text-[#6b6890] mt-1 font-medium">שביעות רצון</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#e8e7f5]">
              <div className="text-2xl font-bold text-[#2a7c7c]">{stats.totalResponses}</div>
              <div className="text-xs text-[#6b6890] mt-1 font-medium">מטופלים השפיעו</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="bg-[#2a7c7c] hover:bg-[#236969] text-white px-6 py-4 rounded-xl font-bold w-full transition-all shadow-md"
        >
          חזרה לעמוד הראשי
        </button>
      </div>
    </div>
  )
}
