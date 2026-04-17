'use client'

import { useState, useEffect } from 'react'
import { getSessionsByDepartment, getResponsesByDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'
import type { SurveySession, Response as SurveyResponse, Question } from '@/lib/types'

interface AdminInsightsProps {
  departmentId: string
}

export function AdminInsights({ departmentId }: AdminInsightsProps) {
  const [sessions, setSessions] = useState<SurveySession[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionsData, responsesData, questionsData] = await Promise.all([
          getSessionsByDepartment(departmentId),
          getResponsesByDepartment(departmentId),
          getQuestionsByDepartment(departmentId)
        ])
        setSessions(sessionsData)
        setResponses(responsesData)
        setQuestions(questionsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [departmentId])

  // Calculate real stats
  const completedSessions = sessions.filter(s => s.isCompleted)
  const totalSessions = sessions.length
  const responseRate = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0
  
  // Calculate emoji scores
  const emojiResponses = responses.filter(r => {
    const question = questions.find(q => q.id === r.questionId)
    return question?.questionType === 'emoji' && r.answerValue
  })
  
  const emojiCounts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  emojiResponses.forEach(r => {
    const value = r.answerValue as string
    if (value in emojiCounts) {
      emojiCounts[value as keyof typeof emojiCounts]++
    }
  })
  
  const totalEmoji = Object.values(emojiCounts).reduce((a, b) => a + b, 0)
  const avgScore = totalEmoji > 0 
    ? Math.round((emojiCounts['5'] * 5 + emojiCounts['4'] * 4 + emojiCounts['3'] * 3 + emojiCounts['2'] * 2 + emojiCounts['1'] * 1) / totalEmoji * 20)
    : 0

  // Star ratings
  const starResponses = responses.filter(r => {
    const question = questions.find(q => q.id === r.questionId)
    return question?.questionType === 'stars' && r.answerValue
  })
  const avgStars = starResponses.length > 0
    ? (starResponses.reduce((acc, r) => acc + parseInt(r.answerValue || '0'), 0) / starResponses.length).toFixed(1)
    : '0.0'

  // Text responses (comments)
  const textResponses = responses.filter(r => {
    const question = questions.find(q => q.id === r.questionId)
    return question?.questionType === 'open_text' && r.answerText?.trim()
  }).slice(0, 5)

  const emojiDist = [
    { emoji: '&#128525;', label: 'excellent', pct: totalEmoji > 0 ? Math.round((emojiCounts['5'] / totalEmoji) * 100) : 0, color: '#2ecfaa' },
    { emoji: '&#128522;', label: 'good', pct: totalEmoji > 0 ? Math.round((emojiCounts['4'] / totalEmoji) * 100) : 0, color: '#6b68c4' },
    { emoji: '&#128528;', label: 'neutral', pct: totalEmoji > 0 ? Math.round((emojiCounts['3'] / totalEmoji) * 100) : 0, color: '#f0a030' },
    { emoji: '&#128543;', label: 'bad', pct: totalEmoji > 0 ? Math.round(((emojiCounts['2'] + emojiCounts['1']) / totalEmoji) * 100) : 0, color: '#e83f8a' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#6b68c4]">טוען נתונים...</div>
      </div>
    )
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPICard
          label="ציון כללי"
          value={avgScore || '-'}
          change={totalSessions > 0 ? 'מבוסס על נתונים אמיתיים' : 'אין נתונים עדיין'}
          trend={avgScore >= 70 ? 'up' : avgScore > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          label="שיעור השלמה"
          value={`${responseRate}%`}
          change={`${completedSessions.length} מתוך ${totalSessions}`}
          trend={responseRate >= 50 ? 'up' : 'neutral'}
        />
        <KPICard
          label="סה״כ תגובות"
          value={completedSessions.length}
          change="סקרים שהושלמו"
          trend="neutral"
        />
        <KPICard
          label="ממוצע כוכבים"
          value={avgStars}
          change={`מתוך ${starResponses.length} דירוגים`}
          trend={parseFloat(avgStars) >= 4 ? 'up' : parseFloat(avgStars) >= 3 ? 'neutral' : 'down'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-5">
        {/* Emoji Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e7f5]">
          <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">פילוג תגובות אמוג&apos;י</h3>
          {totalEmoji > 0 ? (
            <div className="space-y-3">
              {emojiDist.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-2xl" dangerouslySetInnerHTML={{ __html: item.emoji }} />
                  <div className="flex-1 h-2.5 bg-[#f7f7fc] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1e1c4a] min-w-[40px]">{item.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#a8a6c4]">
              אין נתונים עדיין. ברגע שמטופלים ימלאו סקרים, הנתונים יופיעו כאן.
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e7f5]">
          <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">סיכום</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#f7f7fc]">
              <span className="text-[#6b6890]">סה״כ סקרים שנפתחו</span>
              <span className="font-bold text-[#1e1c4a]">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#f7f7fc]">
              <span className="text-[#6b6890]">סקרים שהושלמו</span>
              <span className="font-bold text-[#1e1c4a]">{completedSessions.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#f7f7fc]">
              <span className="text-[#6b6890]">תשובות שנאספו</span>
              <span className="font-bold text-[#1e1c4a]">{responses.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#6b6890]">שאלות פעילות</span>
              <span className="font-bold text-[#1e1c4a]">{questions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e7f5]">
        <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">תגובות טקסט אחרונות</h3>
        {textResponses.length > 0 ? (
          <div className="space-y-3">
            {textResponses.map((response, idx) => (
              <div key={response.id || idx} className="py-2 border-b border-[#f7f7fc] last:border-b-0">
                <p className="text-sm text-[#1e1c4a] leading-relaxed">&quot;{response.answerText}&quot;</p>
                <span className="text-xs text-[#a8a6c4]">
                  {new Date(response.createdAt).toLocaleDateString('he-IL')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#a8a6c4]">
            אין תגובות טקסט עדיין
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  change,
  trend,
}: {
  label: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#e8e7f5]">
      <div className="text-xs text-[#a8a6c4] font-semibold uppercase tracking-wide mb-1">{label}</div>
      <div className="text-3xl font-bold text-[#1e1c4a]">{value}</div>
      <div
        className={`text-xs font-semibold mt-1 ${
          trend === 'up' ? 'text-[#1a9e73]' : trend === 'down' ? 'text-[#e83f8a]' : 'text-[#a8a6c4]'
        }`}
      >
        {change}
      </div>
    </div>
  )
}
