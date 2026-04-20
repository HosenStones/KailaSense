'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')

  const loadQuestions = async () => {
    if (!departmentId) return;
    const data = await getQuestionsByDepartment(departmentId)
    setQuestions(data)
  }

  useEffect(() => {
    loadQuestions()
  }, [departmentId])

  const handleAdd = async () => {
    if (!newQuestionText.trim()) return
    await addQuestion({
      departmentId,
      questionText: newQuestionText,
      questionType: 'emoji',
      isActive: true,
      displayOrder: questions.length + 1
    })
    setNewQuestionText('')
    await loadQuestions()
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="הזן שאלה חדשה"
          className="flex-1 border rounded-lg px-4 py-2 outline-none focus:border-[#2a7c7c]"
        />
        <Button onClick={handleAdd} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
          <Plus className="w-4 h-4 ml-2" /> הוסף שאלה
        </Button>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-[#a8a6c4] text-[#6b6890]">
            אין שאלות פעילות במחלקה זו. הוסף שאלה על מנת להתחיל.
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#f7f7fc] flex items-center justify-center text-sm font-bold text-[#6b6890]">
                  {index + 1}
                </div>
                <span className="font-medium text-[#1e1c4a]">{q.questionText}</span>
              </div>
              <button onClick={() => deleteQuestion(q.id).then(loadQuestions)} className="text-[#a8a6c4] hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
