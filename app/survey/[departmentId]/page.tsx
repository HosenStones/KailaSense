'use client'

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
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2a7c7c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }


  if (!department) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
        <h1 className="text-2xl font-bold text-[#1e1c4a] mb-4">המחלקה לא נמצאה</h1>
        <button onClick={() => window.location.href = '/'} className="bg-[#2a7c7c] text-white px-6 py-3 rounded-xl">חזרה למסך הראשי</button>
      </div>
    )
  }

  return <SurveyContainer department={department} questions={questions} />
}
