'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Question, Response } from '@/lib/types'
import { getDepartmentStats } from '@/lib/firebase/firestore'

interface SurveyThankYouProps {
  departmentName: string
  departmentId: string
  onClose?: () => void
  onRestart?: () => void
  responses?: Record<string, Partial<Response>>
  questions?: Question[]
}

export function SurveyThankYou({ departmentName, departmentId, onClose, onRestart, responses, questions }: SurveyThankYouProps) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [stats, setStats] = useState({ totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDepartmentStats(departmentId)
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [departmentId])

  const getAnswerDisplay = (question: Question, response: Partial<Response> | undefined) => {
    if (!response) return 'לא נענה'
    
    switch (question.questionType) {
      case 'emoji':
        const emojis = ['😢', '😕', '😐', '🙂', '😊']
        return response.answerValue ? emojis[response.answerValue - 1] : 'לא נענה'
      case 'stars':
        return response.answerValue ? '⭐'.repeat(response.answerValue) : 'לא נענה'
      case 'choice':
        const option = question.options?.find(o => o.value === response.answerValue)
        return option?.label || 'לא נענה'
      case 'multi_choice':
        const selectedOptions = question.options?.filter(o => response.answerValues?.includes(o.value))
        return selectedOptions?.map(o => o.label).join(', ') || 'לא נענה'
      case 'open_text':
        return response.answerText || 'לא נענה'
      default:
        return 'לא נענה'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <button 
          onClick={onRestart}
          className="flex items-center justify-center gap-3 mx-auto hover:opacity-80 transition-opacity"
          title="מילוי מחדש"
        >
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila - לחץ למילוי מחדש"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-[#2ecfaa] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white">
            <span role="img" aria-label="check">✓</span>
          </div>

          {/* Thank you message */}
          <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">
            תודה רבה! 💙
          </h1>
          <p className="text-[#6b6890] leading-relaxed mb-6">
            המשוב שלך נשמר בהצלחה ויסייע לנו לשפר את השירות לכל המטופלים הבאים.
          </p>

          {/* Impact Card */}
          <div className="bg-[#f7f7fc] rounded-2xl p-4 mb-6 border border-[#e8e7f5]">
            <div className="text-xs text-[#a8a6c4] mb-3">ההשפעה של המשוב שלך</div>
            {loadingStats ? (
              <div className="text-sm text-[#a8a6c4]">טוען נתונים...</div>
            ) : (
              <div className="flex">
                <div className="flex-1 text-center">
                  <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalResponses}</div>
                  <div className="text-xs text-[#a8a6c4]">משיבים</div>
                </div>
                <div className="flex-1 text-center border-r border-[#e8e7f5]">
                  <div className="text-xl font-bold text-[#2a7c7c]">{stats.satisfactionPercentage}%</div>
                  <div className="text-xs text-[#a8a6c4]">שביעות</div>
                </div>
                <div className="flex-1 text-center border-r border-[#e8e7f5]">
                  <div className="text-xl font-bold text-[#2a7c7c]">{stats.totalComments}</div>
                  <div className="text-xs text-[#a8a6c4]">תגובות</div>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-[#a8a6c4] leading-relaxed mb-6">
            אנחנו קוראים כל תגובה ומתייחסים.
            <br />
            תודה שעזרת לנו להשתפר
          </p>

          {/* View Answers Toggle */}
          {questions && questions.length > 0 && responses && (
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="text-sm text-[#2a7c7c] underline mb-4 hover:text-[#2ecfaa] transition-colors"
            >
              {showAnswers ? 'הסתר תשובות' : 'צפה בתשובות שלי'}
            </button>
          )}

          {/* Answers Summary */}
          {showAnswers && questions && responses && (
            <div className="bg-white rounded-2xl p-4 mb-6 border border-[#e8e7f5] text-right max-h-60 overflow-y-auto">
              <div className="text-xs text-[#a8a6c4] mb-3 font-semibold">התשובות שלי</div>
              <div className="flex flex-col gap-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="border-b border-[#e8e7f5] pb-2 last:border-0">
                    <div className="text-xs text-[#6b6890] mb-1">{index + 1}. {question.questionText}</div>
                    <div className="text-sm text-[#1e1c4a] font-medium">
                      {getAnswerDisplay(question, responses[question.id])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-[#2ecfaa] hover:bg-[#26b896] text-[#1e4a40] font-bold py-4 rounded-xl"
            >
              <Link href="/">סיום</Link>
            </Button>
            
            {onRestart && (
              <Button
                onClick={onRestart}
                variant="outline"
                className="w-full border-[#2a7c7c] text-[#2a7c7c] hover:bg-[#2a7c7c] hover:text-white font-bold py-4 rounded-xl"
              >
                מילוי מחדש
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
