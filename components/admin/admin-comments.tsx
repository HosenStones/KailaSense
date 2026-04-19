'use client'

import { useState, useEffect } from 'react'
import { getResponsesByDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'
import type { Response, Question } from '@/lib/types'

interface AdminCommentsProps {
  departmentId: string
}

export function AdminComments({ departmentId }: AdminCommentsProps) {
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // טעינת שאלות ותגובות במקביל
        const [allResponses, allQuestions] = await Promise.all([
          getResponsesByDepartment(departmentId),
          getQuestionsByDepartment(departmentId)
        ])

        // סינון רק של תגובות טקסטואליות וחיבור לטקסט השאלה
        const textComments = allResponses
          .filter(r => r.answerText && r.answerText.trim() !== '')
          .map(r => {
            const question = allQuestions.find(q => q.id === r.questionId)
            return {
              ...r,
              questionText: question ? question.questionText : 'שאלה לא ידועה'
            }
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setComments(textComments)
      } catch (error) {
        console.error("Error loading comments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (departmentId) loadData()
  }, [departmentId])

  if (isLoading) return <div className="text-center p-8 text-[#a8a6c4]">טוען תגובות...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">תגובות והערות מטופלים ({comments.length})</h3>
      
      {comments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-[#e8e7f5] text-[#a8a6c4]">
          לא נמצאו תגובות טקסטואליות במחלקה זו.
        </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-xl p-4 border border-[#e8e7f5] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-[#2a7c7c] bg-[#e5f3f3] px-2 py-0.5 rounded-full uppercase">
                {new Date(comment.createdAt).toLocaleDateString('he-IL')}
              </span>
            </div>
            <p className="text-xs text-[#6b6890] mb-2 font-medium">שאלה: {comment.questionText}</p>
            <p className="text-sm text-[#1e1c4a] bg-[#f7f7fc] p-3 rounded-lg border-r-4 border-[#2ecfaa]">
              "{comment.answerText}"
            </p>
          </div>
        ))
      )}
    </div>
  )
}
