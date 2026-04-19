'use client'

import { useState, useEffect } from 'react'
import { getResponsesByDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'

export function AdminComments({ departmentId }: { departmentId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadComments() {
      if (!departmentId) return
      setLoading(true)
      const [allResponses, allQuestions] = await Promise.all([
        getResponsesByDepartment(departmentId),
        getQuestionsByDepartment(departmentId)
      ])

      const textComments = allResponses
        .filter(r => r.answerText && r.answerText.trim() !== '')
        .map(r => ({
          ...r,
          questionText: allQuestions.find(q => q.id === r.questionId)?.questionText || 'שאלה כללית'
        }))

      setComments(textComments)
      setLoading(false)
    }
    loadComments()
  }, [departmentId])

  if (loading) return <div className="p-8 text-center">טוען תגובות...</div>

  return (
    <div className="space-y-4" dir="rtl">
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-[#a8a6c4]">טרם התקבלו תגובות טקסטואליות</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-[#e8e7f5] bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-bold text-[#2a7c7c]">
              {new Date(c.createdAt).toLocaleDateString('he-IL')}
            </div>
            <div className="mb-1 text-xs text-[#6b6890]">שאלה: {c.questionText}</div>
            <p className="text-sm text-[#1e1c4a]">"{c.answerText}"</p>
          </div>
        ))
      )}
    </div>
  )
}
