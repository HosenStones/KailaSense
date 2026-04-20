'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Department, Question, Response } from '@/lib/types'
import { SurveyProgress } from './survey-progress'
import { SurveyQuestion } from './survey-question'
import { SurveyNavigation } from './survey-navigation'
import { SurveyThankYou } from './survey-thank-you'
import { createSurveySession, saveResponse, completeSurveySession } from '@/lib/firebase/firestore'

interface SurveyContainerProps {
  department: Department
  questions: Question[]
  source?: string
}

export function SurveyContainer({ department, questions, source }: SurveyContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Auto-init survey session 
  useEffect(() => {
    async function initSession() {
      try {
        const id = await createSurveySession(department.id, source || 'link')
        setSessionId(id)
      } catch (error) {
        console.error('Session init failed:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    initSession()
  }, [department.id, source])

  // Under construction state for empty surveys
  if (!isInitializing && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-white max-w-md w-full rounded-3xl p-10 border border-[#e8e7f5] shadow-xl">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-[#1e1c4a] mb-3">הסקר בבנייה</h2>
          <p className="text-[#6b6890] mb-8 leading-relaxed">אנחנו עדיין מעדכנים את השאלות עבור מחלקת <b>{department.name}</b>. נשמח לשמוע ממך בקרוב!</p>
          <Link href="/" className="block bg-[#2a7c7c] text-white px-6 py-4 rounded-2xl font-bold w-full hover:bg-[#236969] transition-all shadow-md">
            חזרה למסך הראשי
          </Link>
        </div>
      </div>
    )
  }

  // Loading state
  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center text-[#2a7c7c] font-bold">טוען נתונים...</div>
  }

  const currentQuestion = questions[currentIndex]

  // Submit handler
  const handleSubmit = async () => {
    if (!sessionId) return
    setIsSubmitting(true)
    try {
      for (const response of Object.values(responses)) {
        if (response.questionId) {
          await saveResponse({
            sessionId,
            departmentId: department.id,
            questionId: response.questionId,
            answerValue: response.answerValue,
            answerValues: response.answerValues,
            answerText: response.answerText,
          })
        }
      }
      await completeSurveySession(sessionId)
      setIsComplete(true)
    } catch (error) {
      console.error('Submit error:', error)
      alert('שגיאה בשמירה. ודא שיש חיבור אינטרנט.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Thank you state
  if (isComplete) {
    return <SurveyThankYou departmentName={department.name} departmentId={department.id} onRestart={() => window.location.href = '/'} responses={responses} questions={questions} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col" dir="rtl">
      {/* Header with Logo as Home Link */}
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <Link href="/" className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity w-fit mx-auto">
          <Image src="/images/kaila-logo-horizontal.png" alt="Kaila Home" width={80} height={24} className="h-6 w-auto" />
          <span className="text-sm font-bold text-[#2a7c7c]">| {department.name}</span>
        </Link>
      </header>

      <SurveyProgress current={currentIndex + 1} total={questions.length} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SurveyQuestion 
            question={currentQuestion} 
            response={responses[currentQuestion.id] || null} 
            onResponse={(resp) => setResponses(prev => ({...prev, [resp.questionId!]: resp}))} 
          />
        </div>
      </div>

      <div className="p-4 pb-10 max-w-md mx-auto w-full">
        <SurveyNavigation
          canGoBack={currentIndex > 0} 
          canGoForward={currentIndex < questions.length - 1} 
          isLastQuestion={currentIndex === questions.length - 1}
          isAnswered={!!(responses[currentQuestion.id]?.answerValue || responses[currentQuestion.id]?.answerText || (responses[currentQuestion.id]?.answerValues?.length ?? 0) > 0)} 
          isRequired={currentQuestion.isRequired}
          onBack={() => setCurrentIndex(prev => prev - 1)} 
          onNext={() => setCurrentIndex(prev => prev + 1)} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
