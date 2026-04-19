'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getQuestionsByDepartment, deleteQuestion, addQuestion } from '@/lib/firebase/firestore'
import type { Question } from '@/lib/types'

interface AdminQuestionsProps {
  departmentId: string
}

export function AdminQuestions({ departmentId }: AdminQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // State for Add Question Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<'emoji' | 'choice' | 'multi_choice' | 'stars' | 'open_text'>('emoji')
  const [isAdding, setIsAdding] = useState(false)

  const typeLabels: Record<string, string> = {
    emoji: 'אמוג\'י',
    choice: 'בחירה',
    multi_choice: 'רב-בחירה',
    stars: 'כוכבים',
    open_text: 'טקסט פתוח',
  }

  // Fetch questions from Firebase
  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(data)
    } catch (error) {
      console.error("Error loading questions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (departmentId) {
      loadQuestions()
    }
  }, [departmentId])

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק את השאלה?')) return
    
    try {
      await deleteQuestion(id)
      setQuestions(questions.filter(q => q.id !== id))
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("שגיאה במחיקת השאלה")
    }
  }

  // Handle Add New Question
  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) return
    
    setIsAdding(true)
    try {
      await addQuestion({
        departmentId,
        questionText: newQuestionText,
        questionType: newQuestionType,
        isRequired: true,
        isDefault: false,
        displayOrder: questions.length + 1,
        isActive: true,
        options: newQuestionType === 'emoji' ? [
          { value: '5', label: 'מעולה', emoji: '😍' },
          { value: '4', label: 'טוב', emoji: '😊' },
          { value: '3', label: 'בסדר', emoji: '😐' },
          { value: '2', label: 'לא טוב', emoji: '😟' },
          { value: '1', label: 'גרוע מאוד', emoji: '😡' },
        ] : null
      })
      
      await loadQuestions() // Reload list
      setNewQuestionText('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding question:", error)
      alert("שגיאה בהוספת השאלה")
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return <div className="text-center p-4 text-[#a8a6c4]">טוען שאלות...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1e1c4a]">ניהול שאלות</h3>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2a7c7c] hover:bg-[#236969] text-white text-sm font-semibold px-4 py-2 h-auto rounded-lg">
                + הוסף שאלה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת שאלה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-[#1e1c4a]">טקסט השאלה</label>
                  <Input
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="לדוגמה: איך היתה הארוחה?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1e1c4a]">סוג תגובה</label>
                  <Select value={newQuestionType} onValueChange={(v: any) => setNewQuestionType(v)}>
                    <SelectTrigger className="mt-1 text-right" dir="rtl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="emoji">אמוג'י</SelectItem>
                      <SelectItem value="stars">כוכבים</SelectItem>
                      <SelectItem value="open_text">טקסט פתוח</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddQuestion}
                  disabled={isAdding || !newQuestionText.trim()}
                  className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white"
                >
                  {isAdding ? 'שומר...' : 'שמור שאלה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {questions.length === 0 ? (
          <div className="text-center p-8 text-[#a8a6c4] bg-white rounded-xl border border-[#e8e7f5]">
            אין שאלות במחלקה זו. הוסיפי שאלה חדשה.
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-xl p-4 border border-[#e8e7f5] flex items-center gap-3"
            >
              <span className="text-[#e8e7f5] cursor-grab">⋮⋮</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1e1c4a] mb-1">{question.questionText}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      question.isDefault ? 'bg-[#e5f3f3] text-[#2a7c7c]' : 'bg-[#e4faf5] text-[#0a5c4a]'
                    }`}>
                    {question.isDefault ? 'קבועה' : 'מותאמת'}
                  </span>
                  <span className="text-xs text-[#a8a6c4]">{typeLabels[question.questionType] || question.questionType}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleDelete(question.id)}
                  className="p-2 bg-[#f7f7fc] border border-[#e8e7f5] rounded-lg text-sm hover:bg-[#fde8f2] transition-colors"
                  title="מחק שאלה"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
