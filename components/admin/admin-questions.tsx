'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question } from '@/lib/types'
import { Plus, Trash2, Sparkles } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newQuestionText, setNewQuestionText] = useState('')

  const loadQuestions = async () => {
    setIsLoading(true)
    const data = await getQuestionsByDepartment(departmentId)
    setQuestions(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (departmentId) loadQuestions()
  }, [departmentId])

  const handleAdd = async () => {
    if (!newQuestionText.trim()) return
    await addQuestion({
      departmentId,
      text: newQuestionText,
      type: 'emoji', // Default type
      displayOrder: questions.length + 1
    })
    setNewQuestionText('')
    // Refresh list to prevent questions from "disappearing"
    await loadQuestions()
  }

  const handleDelete = async (id: string) => {
    await deleteQuestion(id)
    await loadQuestions()
  }

  if (isLoading) return <div className="p-4 text-center text-[#6b6890]">טוען שאלות...</div>

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="הזיני שאלה חדשה..."
          className="flex-1 border rounded-lg px-4 py-2 outline-none focus:border-[#2a7c7c]"
        />
        <Button onClick={handleAdd} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
          <Plus className="w-4 h-4 ml-2" /> הוסף שאלה
        </Button>
        {/* Unclickable AI Button as requested */}
        <Button disabled className="bg-[#6b6890] opacity-50 cursor-not-allowed text-white">
          <Sparkles className="w-4 h-4 ml-2" /> הוספת שאלה באמצעות AI
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e8e7f5] overflow-hidden">
        {questions.map((q) => (
          <div key={q.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-[#f7f7fc]">
            <span className="text-[#1e1c4a] font-medium">{q.text}</span>
            <Button variant="ghost" onClick={() => q.id && handleDelete(q.id)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
