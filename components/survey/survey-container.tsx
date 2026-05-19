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

  // Initialize session on mount for the patient
  useEffect(() => {
    async function initSession() {
      try {
        const id = await createSurveySession(department.id, source || 'link')
        setSessionId(id)
      } catch (error) {
        console.error('Failed to initialize survey session:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    initSession()
  }, [department.id, source])

  // Handle departments with no questions defined
  if (!isInitializing && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-card/95 backdrop-blur-md max-w-md w-full rounded-3xl p-10 border border-border shadow-xl">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-card-foreground mb-3">הסקר בבנייה</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">אנחנו עדיין מעדכנים את השאלות עבור מחלקת <b>{department.name}</b>. נשמח לשמוע ממך בקרוב!</p>
          <Link href="/" className="block bg-primary text-primary-foreground px-6 py-4 rounded-2xl font-bold w-full hover:bg-primary/90 transition-all shadow-md text-center">
            חזרה למסך הראשי
          </Link>
        </div>
      </div>
    )
  }

  // Show loading indicator during initialization
  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center text-primary font-bold">מכין את הסקר...</div>
  }

  const currentQuestion = questions[currentIndex]

  // Final submission of all gathered responses
  const handleSubmit = async () => {
    if (!sessionId) {
      alert('שגיאה: לא נוצר סשן לסקר. אנא נסה לרענן את העמוד.');
      return;
    }
    setIsSubmitting(true)
    
    try {
      // Loop through responses and save them individually to Firestore
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
      // Finalize the session
      await completeSurveySession(sessionId)
      setIsComplete(true)
    } catch (error: any) {
      console.error('Submission failed:', error)
      alert('שגיאה בשמירת הנתונים. ודא שחוקי האבטחה ב-Firebase מאפשרים כתיבה למטופלים.');
    } finally {
      setIsSubmitting(false)
    }
  }

  // Display final thank you screen
  if (isComplete) {
    return <SurveyThankYou departmentName={department.name} departmentId={department.id} onRestart={() => window.location.href = '/'} responses={responses} questions={questions} />
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col" dir="rtl">
      {/* Header with Logo linking to Home */}
<header className="bg-[#2a7c7c] w-full h-16 px-6 flex items-center justify-center sticky top-0 z-50 shadow-md">
  <div className="flex items-center gap-4">
    {/* Homepage link with logo and department name */}
    <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
      {/* Horizontal logo image with rounded corners */}
      <Image 
        src="/images/kaila-logo-horizontal-white.png" 
        alt="Kaila" 
        width={80} 
        height={24}
        className="h-6 w-auto rounded-xl drop-shadow-md"
      />
      
      {/* Thin vertical separator */}
      <div className="h-6 w-[1px] bg-white/30" />
      
      {/* Department name display */}
      <span className="text-white font-semibold text-lg tracking-wide">
        {department.name}
      </span>
    </Link>
  </div>
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
