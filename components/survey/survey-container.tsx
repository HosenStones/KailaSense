'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
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

type SurveyStep = 'questions' | 'thankyou'

export function SurveyContainer({ department, questions, source }: SurveyContainerProps) {
  const [step, setStep] = useState<SurveyStep>('questions')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Auto-initialize session to skip redundant welcome screen
  useEffect(() => {
    async function initSession() {
      try {
        const id = await createSurveySession(department.id, source || 'link')
        setSessionId(id)
      } catch (error) {
        console.error('Failed to init survey session:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    initSession()
  }, [department.id, source])

  const currentQuestion = questions[currentIndex]

  const handleSubmit = async () => {
    if (!sessionId) return
    setIsSubmitting(true)

    try {
      for (const response of Object.values(responses)) {
        if (response.questionId) {
          await saveResponse({
            sessionId,
            departmentId: department.id, // Fixed: Added department link for analytics
            questionId: response.questionId,
            answerValue: response.answerValue,
            answerValues: response.answerValues,
            answerText: response.answerText,
          })
        }
      }
      await completeSurveySession(sessionId)
      setStep('thankyou')
    } catch (error) {
      console.error('Error saving survey responses:', error)
      alert('שגיאה בשמירת התשובות. אנא בדוק את חיבור האינטרנט.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResponse = (response: Partial<Response>) => {
    setResponses((prev) => ({ ...prev, [response.questionId!]: response }))
  }

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center text-[#2a7c7c]">טוען סקר...</div>

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 text-center border border-[#e8e7f5] shadow-sm">
          <div className="text-5xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-[#1e1c4a] mb-2">הסקר בבנייה</h2>
          <p className="text-[#6b6890] mb-8">כרגע אין שאלות פעילות במחלקה זו.</p>
          <button onClick={() => window.location.href = '/'} className="bg-[#2a7c7c] text-white px-6 py-3 rounded-xl font-bold w-full">חזרה למסך הראשי</button>
        </div>
      </div>
    )
  }

  if (step === 'thankyou') {
    return <SurveyThankYou departmentName={department.name} departmentId={department.id} onRestart={() => window.location.href = '/'} responses={responses} questions={questions} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col" dir="rtl">
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <Image src="/images/kaila-logo-horizontal.png" alt="Kaila" width={80} height={24} className="h-6 w-auto" />
          <span className="text-sm font-bold text-[#2a7c7c]">| {department.name}</span>
        </div>
      </header>

      <SurveyProgress current={currentIndex + 1} total={questions.length} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SurveyQuestion question={currentQuestion} response={responses[currentQuestion.id] || null} onResponse={handleResponse} />
        </div>
      </div>

      <div className="p-4 pb-6 max-w-md mx-auto w-full">
        <SurveyNavigation
          canGoBack={currentIndex > 0} 
          canGoForward={currentIndex < questions.length - 1} 
          isLastQuestion={currentIndex === questions.length - 1}
          isAnswered={!!(responses[currentQuestion.id]?.answerValue || responses[currentQuestion.id]?.answerText || responses[currentQuestion.id]?.answerValues)} 
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
