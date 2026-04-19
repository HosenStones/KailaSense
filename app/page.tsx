"use client"

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SurveyProgress } from '@/components/survey/survey-progress'
import { SurveyQuestion } from '@/components/survey/survey-question'
import { SurveyNavigation } from '@/components/survey/survey-navigation'
import { SurveyThankYou } from '@/components/survey/survey-thank-you'
import { createSurveySession, saveResponse, completeSurveySession } from '@/lib/firebase/firestore'
import type { Response } from '@/lib/types'
import { Button } from '@/components/ui/button'

type SurveyStep = 'welcome' | 'questions' | 'thankyou'

export default function HomePage() {
  const [step, setStep] = useState<SurveyStep>('welcome')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = demoQuestions
  const department = demoDepartment
  const currentQuestion = questions[currentIndex]

  const handleStart = useCallback(async () => {
    try {
      const id = await createSurveySession(department.id, 'web')
      setSessionId(id)
      setStep('questions')
    } catch (error) {
      console.error('Error starting survey:', error)
      setSessionId('demo-session-' + Date.now())
      setStep('questions')
    }
  }, [department.id])

  const handleResponse = useCallback((response: Partial<Response>) => {
    setResponses((prev) => ({
      ...prev,
      [response.questionId!]: response,
    }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, questions.length])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return

    setIsSubmitting(true)

    try {
      for (const response of Object.values(responses)) {
        if (response.questionId) {
          await saveResponse({
            sessionId,
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
      console.error('Error submitting survey:', error)
      setStep('thankyou')
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, responses])

  const isAnswered = useCallback((questionId: string, questionType: string) => {
    const response = responses[questionId]
    if (!response) return false

    switch (questionType) {
      case 'emoji':
      case 'choice':
      case 'stars':
        return !!response.answerValue
      case 'multi_choice':
        return (response.answerValues?.length ?? 0) > 0
      case 'open_text':
        return !!response.answerText?.trim()
      default:
        return false
    }
  }, [responses])

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#e8faf5] via-white to-[#f0eff9] flex flex-col items-center justify-center px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/images/kaila-logo-vertical.png"
            alt="Kaila Sense"
            width={140}
            height={140}
            className="h-32 w-auto"
            priority
          />
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-[#2ecfaa] to-[#26b896] rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-3xl text-white">&#128153;</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-3 text-center">
          המשוב שלך חשוב לנו
        </h1>
        <p className="text-[#5a7184] text-center mb-8 leading-relaxed max-w-xs">
          תודה שבחרת להשתתף.
          <br />
          המשוב שלך עוזר לנו לשפר את השירות.
        </p>

        <div className="flex gap-3 mb-8 w-full max-w-sm">
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-[#e0f5ef]">
            <div className="text-[#2ecfaa] font-bold text-sm">{"<2 דק'"}</div>
            <div className="text-[#8fa3b1] text-xs mt-0.5">זמן מילוי</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-[#e0f5ef]">
            <div className="text-[#2ecfaa] font-bold text-sm">&#128274;</div>
            <div className="text-[#8fa3b1] text-xs mt-0.5">אנונימי</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-[#e0f5ef]">
            <div className="text-[#2ecfaa] font-bold text-sm">AI</div>
            <div className="text-[#8fa3b1] text-xs mt-0.5">ניתוח חכם</div>
          </div>
        </div>

        <div className="bg-[#f0eff9] rounded-xl p-4 w-full max-w-sm mb-8 border border-[#dddaf0]">
          <div className="text-[#1e3a5f] font-semibold text-sm">{department.name}</div>
          <div className="text-[#5a7184] text-xs mt-1">השאלון נשלח אליך אוטומטית לאחר הטיפול</div>
        </div>

        <Button 
          onClick={handleStart}
          className="w-full max-w-sm bg-gradient-to-r from-[#2ecfaa] to-[#26b896] hover:from-[#26b896] hover:to-[#1fa789] text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          התחל משוב
        </Button>

        

        <Link 
          href="/admin/login" 
          className="mt-10 text-[#5a7184] text-sm underline hover:text-[#2ecfaa] transition-colors"
        >
          כניסת מנהלים
        </Link>
      </main>
    )
  }

  // Thank You Screen
  if (step === 'thankyou') {
    return (
      <SurveyThankYou 
        departmentName={department.name}
        departmentId={department.id}
        onRestart={() => {
          setStep('welcome')
          setCurrentIndex(0)
          setResponses({})
          setSessionId(null)
        }}
        responses={responses}
        questions={questions}
      />
    )
  }

  // Questions Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f9fb] flex flex-col">
      <header className="bg-white border-b border-[#e8f0f5] px-4 py-3 text-center shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </header>

      <SurveyProgress current={currentIndex + 1} total={questions.length} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SurveyQuestion
            question={currentQuestion}
            response={responses[currentQuestion.id] || null}
            onResponse={handleResponse}
          />
        </div>
      </div>

      <div className="p-4 pb-6">
        <div className="max-w-md mx-auto">
          <SurveyNavigation
            canGoBack={currentIndex > 0}
            canGoForward={currentIndex < questions.length - 1}
            isLastQuestion={currentIndex === questions.length - 1}
            isAnswered={isAnswered(currentQuestion.id, currentQuestion.questionType)}
            isRequired={currentQuestion.isRequired}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
