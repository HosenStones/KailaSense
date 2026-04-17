'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { Department, Question, Response } from '@/lib/types'
import { SurveyWelcome } from './survey-welcome'
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

type SurveyStep = 'welcome' | 'questions' | 'thankyou'

export function SurveyContainer({ department, questions, source }: SurveyContainerProps) {
  const [step, setStep] = useState<SurveyStep>('welcome')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]

  const handleRestart = useCallback(() => {
    setStep('welcome')
    setCurrentIndex(0)
    setResponses({})
    setSessionId(null)
  }, [])

  const handleStart = useCallback(async () => {
    try {
      const id = await createSurveySession(department.id, source)
      setSessionId(id)
      setStep('questions')
    } catch (error) {
      console.error('Error starting survey:', error)
      // Still proceed even if Firebase fails (for demo purposes)
      setSessionId('demo-session')
      setStep('questions')
    }
  }, [department.id, source])

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
      // Save all responses
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

      // Mark session as complete
      await completeSurveySession(sessionId)
      
      setStep('thankyou')
    } catch (error) {
      console.error('Error submitting survey:', error)
      // Still show thank you even if Firebase fails (for demo)
      setStep('thankyou')
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, responses])

  const isAnswered = useCallback((question: Question) => {
    const response = responses[question.id]
    if (!response) return false

    switch (question.questionType) {
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

  if (step === 'welcome') {
    return <SurveyWelcome department={department} onStart={handleStart} />
  }

  if (step === 'thankyou') {
    return (
      <SurveyThankYou 
        departmentName={department.name} 
        onRestart={handleRestart}
        responses={responses}
        questions={questions}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <button 
          onClick={handleRestart}
          className="flex items-center justify-center gap-3 mb-1 mx-auto hover:opacity-80 transition-opacity"
          title="חזרה להתחלה"
        >
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila - לחץ לחזרה להתחלה"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
          <span className="text-sm font-bold text-[#3d3a9e]">- {department.name}</span>
        </button>
      </header>

      {/* Progress */}
      <SurveyProgress current={currentIndex + 1} total={questions.length} />

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SurveyQuestion
            question={currentQuestion}
            response={responses[currentQuestion.id] || null}
            onResponse={handleResponse}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 pb-6">
        <div className="max-w-md mx-auto">
          <SurveyNavigation
            canGoBack={currentIndex > 0}
            canGoForward={currentIndex < questions.length - 1}
            isLastQuestion={currentIndex === questions.length - 1}
            isAnswered={isAnswered(currentQuestion)}
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
