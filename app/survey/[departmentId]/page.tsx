'use client'
export const runtime = 'edge';

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAllDepartments, getQuestionsByDepartment } from '@/lib/firebase/firestore'
import { SurveyContainer } from '@/components/survey/survey-container'
import type { Department, Question } from '@/lib/types'

export default function SurveyPage() {
  const params = useParams()
  const departmentId = params.departmentId as string
  
  const [department, setDepartment] = useState<Department | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSurveyData() {
      if (!departmentId) return
      
      try {
        const depts = await getAllDepartments()
        const currentDept = depts.find(d => d.id === departmentId)
        if (currentDept) {
          setDepartment(currentDept)
          const deptQuestions = await getQuestionsByDepartment(departmentId)
          setQuestions(deptQuestions)
        }
      } catch (error) {
        console.error("Error loading survey data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSurveyData()
  }, [departmentId])

  if (loading) {
    return <div className="min-h-screen bg-transparent flex items-center justify-center text-primary font-bold">טוען סקר...</div>
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-card/95 backdrop-blur-md max-w-md w-full rounded-3xl p-8 border border-border shadow-xl text-center">
          <h1 className="text-2xl font-bold text-card-foreground mb-4">המחלקה לא נמצאה</h1>
          <button onClick={() => window.location.href = '/'} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all shadow-md">
            חזרה למסך הראשי
          </button>
        </div>
      </div>
    )
  }

  return <SurveyContainer department={department} questions={questions} source="link" />
}
