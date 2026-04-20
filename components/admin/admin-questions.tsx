'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionOption } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [departmentId])

  const handleAdd = async () => {
    if (!newQuestionText.trim()) return
    
    if ((newQuestionType === 'choice' || newQuestionType === 'multi_choice') && !newOptionsText.trim()) {
      alert('יש להזין אפשרויות תשובה עבור בחירה מרובה/יחידה')
      return
    }

    setIsSubmitting(true)

    let options: QuestionOption[] | undefined = undefined;
    if (newQuestionType === 'choice' || newQuestionType === 'multi_choice') {
      options = newOptionsText.split(',').map(opt => ({
        label: opt.trim(),
        value: opt.trim()
      })).filter(opt => opt.label !== '');
    }

    try {
      await addQuestion({
        departmentId,
        questionText: newQuestionText,
        questionType: newQuestionType,
        options,
        isActive: true,
        displayOrder: questions.length + 1
      })
      setNewQuestionText('')
      setNewQuestionType('emoji')
      setNewOptionsText('')
      await loadQuestions()
    } catch (error) {
      console.error("Error adding question:", error)
      alert('שגיאה בשמירת השאלה.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            type="text" 
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="הזן שאלה חדשה..."
            className="flex-1"
          />
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="w-full md:w-48 border-[#e8e7f5]"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="emoji">אימוג'י (1-5)</SelectItem>
              <SelectItem value="stars">כוכבים (1-5)</SelectItem>
              <SelectItem value="choice">בחירה יחידה</SelectItem>
              <SelectItem value="multi_choice">בחירה מרובה</SelectItem>
              <SelectItem value="open_text">טקסט חופשי</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <Input 
              type="text" 
              value={newOptionsText}
              onChange={(e) => setNewOptionsText(e.target.value)}
              placeholder="הזן אפשרויות (מופרדות בפסיק, למשל: רופא, אחות, ניקיון)"
              className="w-full border-[#2a7c7c]/30 focus-visible:ring-[#2a7c7c]"
            />
            <p className="text-xs text-gray-500 mt-1">הפרד את האפשרויות באמצעות פסיק (,)</p>
          </div>
        )}

        <Button onClick={handleAdd} disabled={isSubmitting || !newQuestionText} className="bg-[#2a7c7c] hover:bg-[#236969] text-white w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" /> {isSubmitting ? 'שומר...' : 'הוסף שאלה'}
        </Button>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-[#a8a6c4] text-[#6b6890]">
            אין שאלות פעילות במחלקה זו.
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm gap-4">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#f7f7fc] flex items-center justify-center text-sm font-bold text-[#6b6890]">
                  {index + 1}
                </div>
                <div>
                  <span className="font-medium text-[#1e1c4a] block">{q.questionText}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {q.questionType === 'emoji' ? 'אימוג\'י' : q.questionType === 'stars' ? 'כוכבים' : q.questionType === 'choice' ? 'בחירה יחידה' : q.questionType === 'multi_choice' ? 'בחירה מרובה' : 'טקסט חופשי'}
                    </span>
                    {q.options && q.options.length > 0 && (
                      <span className="text-xs text-[#2a7c7c] font-medium">({q.options.length} אפשרויות)</span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id).then(loadQuestions)} className="text-[#a8a6c4] hover:text-red-500 hover:bg-red-50 self-end md:self-auto">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
