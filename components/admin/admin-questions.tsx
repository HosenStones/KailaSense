'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionOption } from '@/lib/types'
import { Plus, Trash2, ListPlus } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load questions from Firestore
  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(data)
    } catch (e) {
      console.error("Failed to load questions:", e)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [departmentId])

  // Handle adding a new question safely
  const handleAdd = async () => {
    if (!newQuestionText.trim() || !departmentId) return
    
    // Validate choice options
    if ((newQuestionType === 'choice' || newQuestionType === 'multi_choice') && !newOptionsText.trim()) {
      alert('חובה להזין אפשרויות תשובה (מופרדות בפסיק) עבור סוג שאלה זה.')
      return
    }

    setIsSubmitting(true)

    try {
      // Build base question data without options field to prevent Firebase undefined errors
      const newQuestionData: any = {
        departmentId,
        questionText: newQuestionText,
        questionType: newQuestionType,
        isActive: true,
        displayOrder: questions.length + 1
      }

      // Add options field only if it is a choice type question
      if (newQuestionType === 'choice' || newQuestionType === 'multi_choice') {
        newQuestionData.options = newOptionsText.split(',').map(opt => ({
          label: opt.trim(),
          value: opt.trim()
        })).filter(opt => opt.label !== '')
      }

      await addQuestion(newQuestionData)
      
      // Reset form upon success
      setNewQuestionText('')
      setNewQuestionType('emoji')
      setNewOptionsText('')
      await loadQuestions()
      alert('השאלה נשמרה בהצלחה!')
    } catch (error) {
      console.error("Error adding question:", error)
      alert('שגיאה בשמירת השאלה. ודא שאתה מחובר ושיש הרשאות מתאימות.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Add New Question Form */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            type="text" 
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="הזן שאלה חדשה (למשל: איך היית מדרג את השירות?)"
            className="flex-1 h-12"
          />
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="w-full md:w-52 h-12 border-[#e8e7f5]"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="emoji">😊 אימוג'י (1-5)</SelectItem>
              <SelectItem value="stars">⭐ כוכבים (1-5)</SelectItem>
              <SelectItem value="choice">🔘 בחירה יחידה</SelectItem>
              <SelectItem value="multi_choice">✅ בחירה מרובה</SelectItem>
              <SelectItem value="open_text">📝 טקסט חופשי</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Options Input */}
        {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
          <div className="p-4 bg-[#f7f7fc] rounded-xl border border-dashed border-[#2a7c7c]/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-[#2a7c7c]">
              <ListPlus className="w-4 h-4" />
              <span className="text-sm font-bold">הגדרת אפשרויות תשובה</span>
            </div>
            <Input 
              type="text" 
              value={newOptionsText}
              onChange={(e) => setNewOptionsText(e.target.value)}
              placeholder="הכנס אפשרויות מופרדות בפסיק (למשל: רופא, אחות, צוות ניקיון)"
              className="w-full bg-white"
            />
            <p className="text-[11px] text-gray-500 mt-2">הפרד בין התשובות באמצעות פסיק (,). כל מילה תהפוך לכפתור לבחירה בסקר.</p>
          </div>
        )}

        <Button 
          onClick={handleAdd} 
          disabled={isSubmitting || !newQuestionText} 
          className="bg-[#2a7c7c] hover:bg-[#236969] text-white w-full h-12 font-bold transition-all"
        >
          <Plus className="w-5 h-5 ml-2" /> {isSubmitting ? 'שומר נתונים...' : 'הוסף שאלה למחלקה'}
        </Button>
      </div>

      {/* List of Questions */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-[#a8a6c4] text-[#6b6890]">
            <p className="text-lg">אין עדיין שאלות במחלקה זו.</p>
            <p className="text-sm opacity-70">השתמש בטופס למעלה כדי להוסיף את השאלה הראשונה.</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm group hover:border-[#2a7c7c] transition-all">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#f7f7fc] flex items-center justify-center text-sm font-bold text-[#2a7c7c]">
                  {index + 1}
                </div>
                <div>
                  <span className="font-bold text-[#1e1c4a] block">{q.questionText}</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] bg-[#f0f9f9] text-[#1a5c5c] px-2 py-0.5 rounded font-bold uppercase">
                      {q.questionType === 'emoji' ? 'דירוג אימוג\'י' : q.questionType === 'stars' ? 'דירוג כוכבים' : q.questionType === 'choice' ? 'בחירה יחידה' : q.questionType === 'multi_choice' ? 'בחירה מרובה' : 'תגובה חופשית'}
                    </span>
                    {q.options && q.options.length > 0 && (
                      <span className="text-[10px] text-[#2a7c7c] bg-[#e6f4f4] px-2 py-0.5 rounded">
                        אפשרויות: {q.options.map(o => o.label).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { if(confirm('למחוק את השאלה?')) deleteQuestion(q.id).then(loadQuestions) }}
                className="text-[#a8a6c4] hover:text-red-500 hover:bg-red-50 self-end md:self-auto mt-2 md:mt-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
