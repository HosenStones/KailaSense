'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, getAllDepartments } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Plus, Trash2, ListPlus, Image as ImageIcon, Video, AlignLeft, Info, BookOpen, Layers3 } from 'lucide-react'
import { PREDEFINED_QUESTION_BANK, type BankItem } from '@/lib/question-bank'

// Helper for type labels
const getTypeLabel = (type: QuestionType) => {
  switch (type) {
    case 'emoji': return '😊 אימוג\'י';
    case 'stars': return '⭐ כוכבים';
    case 'choice': return '🔘 בחירה יחידה';
    case 'multi_choice': return '✅ בחירה מרובה';
    case 'open_text': return '📝 טקסט חופשי';
    case 'content': return '📺 תוכן';
    default: return type;
  }
}

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [departmentName, setDepartmentName] = useState('')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newCategory, setNewCategory] = useState<QuestionCategory>('general')
  const [newOptionsText, setNewOptionsText] = useState('')
  
  const [newContentType, setNewContentType] = useState<ContentType>('info_text')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBank, setShowBank] = useState(false)

  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(data)

      const allDepts = await getAllDepartments()
      const currentDept = allDepts.find(d => d.id === departmentId)
      if (currentDept) setDepartmentName(currentDept.name)
    } catch (e) {
      console.error("Failed to load questions:", e)
    }
  }

  useEffect(() => { loadQuestions() }, [departmentId])

  // Smart Warning Logic per category
  const categories: QuestionCategory[] = ['admission', 'during', 'discharge', 'after_discharge', 'general']
  const problematicCategories = categories.filter(cat => {
    const catQuestions = questions.filter(q => q.category === cat && q.questionType !== 'content')
    const openTextCount = catQuestions.filter(q => q.questionType === 'open_text').length
    return catQuestions.length > 3 || openTextCount > 1
  })

  const getMatchedTag = (name: string): string => {
    if (!name) return 'כללי';
    if (name.includes('יולדות')) return 'יולדות';
    if (name.includes('מיון')) return 'מיון';
    if (name.includes('אורתופדיה')) return 'אורתופדיה';
    return 'כללי';
  }
  const currentTargetTag = getMatchedTag(departmentName)

  const handleAdd = async (data: any) => {
    setIsSubmitting(true)
    try {
      await addQuestion(data)
      await loadQuestions()
    } catch (error) { console.error(error) } finally { setIsSubmitting(false) }
  }

  const handleBatchAdd = async (items: BankItem[], category: QuestionCategory) => {
    setIsSubmitting(true)
    try {
      for (const item of items) {
        await addQuestion({
          departmentId,
          questionText: item.text,
          questionType: item.type,
          category,
          isActive: true,
          displayOrder: 99,
          ...(item.type === 'content' ? { contentType: item.contentType, contentBody: item.contentBody, contentUrl: item.contentUrl } : {}),
          ...(item.options ? { options: item.options.map(o => ({ label: o, value: o })) } : {})
        })
      }
      await loadQuestions()
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {problematicCategories.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
          <Info className="w-5 h-5 mb-2" />
          <strong>💡 שימו לב:</strong>
          <ul className="list-disc list-inside text-sm">
            {problematicCategories.map(cat => (
              <li key={cat}>בשלב ה{cat === 'admission' ? 'קבלה' : cat === 'during' ? 'אשפוז' : cat === 'discharge' ? 'שחרור' : cat === 'after_discharge' ? '24 שעות אחרי' : 'כללי'} יש יותר מדי שאלות או יותר משאלה פתוחה אחת.</li>
            ))}
          </ul>
        </div>
      )}

      {/* Question Bank */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <button onClick={() => setShowBank(!showBank)} className="w-full flex items-center justify-between p-4 font-bold text-primary">
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> <span>בנק שאלות</span></div>
          <span>{showBank ? 'סגור' : 'פתח'}</span>
        </button>

        {showBank && (
          <div className="p-4 bg-secondary/30 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(PREDEFINED_QUESTION_BANK) as QuestionCategory[]).map((cat) => {
              const filteredItems = PREDEFINED_QUESTION_BANK[cat].filter(i => i.tag === 'כללי' || i.tag === currentTargetTag);
              if (filteredItems.length === 0) return null;

              return (
                <div key={cat} className="bg-card p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-primary">{cat}</h4>
                    <Button size="sm" variant="outline" onClick={() => handleBatchAdd(filteredItems, cat)} className="text-xs">הוסף הכל</Button>
                  </div>
                  <div className="space-y-2">
                    {filteredItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-secondary/50 rounded-lg text-xs">
                        <div>
                          <span className="block font-semibold">{item.text}</span>
                          <span className="text-[10px] text-muted-foreground">{getTypeLabel(item.type)}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleBatchAdd([item], cat)}>+</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Render Categorized Layout */}
      <div className="space-y-6">
        {categories.map(cat => {
          const catQuestions = questions.filter(q => q.category === cat)
          if (catQuestions.length === 0) return null
          
          return (
            <div key={cat} className="space-y-2">
              <h3 className="font-bold text-lg text-primary capitalize">{cat}</h3>
              {catQuestions.map(q => (
                <div key={q.id} className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{q.questionText}</p>
                    <span className="text-[10px] bg-secondary px-2 rounded-full">{getTypeLabel(q.questionType)}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id).then(loadQuestions)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
