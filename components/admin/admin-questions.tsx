'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question, QuestionType } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')

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
      questionType: newQuestionType,
      isActive: true,
      displayOrder: questions.length + 1
    })
    setNewQuestionText('')
    setNewQuestionType('emoji')
    await loadQuestions()
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-2 mb-6 bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm">
        <input 
          type="text" 
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="הזן שאלה חדשה..."
          className="flex-1 border rounded-lg px-4 py-2 outline-none focus:border-[#2a7c7c]"
        />
        <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
          <SelectTrigger className="w-full md:w-40 border-[#e8e7f5]"><SelectValue /></SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="emoji">אימוג'י (1-5)</SelectItem>
            <SelectItem value="stars">כוכבים (1-5)</SelectItem>
            <SelectItem value="open_text">טקסט חופשי</SelectItem>
          </SelectContent>
        </Select>
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
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                  {q.questionType === 'emoji' ? 'אימוג\'י' : q.questionType === 'stars' ? 'כוכבים' : 'טקסט'}
                </span>
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
