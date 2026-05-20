'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Plus, Trash2, ListPlus, Image as ImageIcon, Video, AlignLeft, Info } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newCategory, setNewCategory] = useState<QuestionCategory>('general')
  const [newOptionsText, setNewOptionsText] = useState('')
  
  // Content block specific states
  const [newContentType, setNewContentType] = useState<ContentType>('info_text')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  
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

  // Calculate totals for system recommendations
  const openQuestionsCount = questions.filter(q => q.questionType === 'open_text').length;
  const totalQuestionsCount = questions.filter(q => q.questionType !== 'content').length;
  const showWarning = totalQuestionsCount > 3 || openQuestionsCount > 1;

  // Handle adding a new question or content block safely
  const handleAdd = async () => {
    if (!newQuestionText.trim() || !departmentId) return
    
    // Validate choice options
    if ((newQuestionType === 'choice' || newQuestionType === 'multi_choice') && !newOptionsText.trim()) {
      alert('חובה להזין אפשרויות תשובה (מופרדות בפסיק) עבור סוג שאלה זה.')
      return
    }

    setIsSubmitting(true)

    try {
      // Build base question data
      const newQuestionData: any = {
        departmentId,
        questionText: newQuestionText, // Acts as title for content blocks
        questionType: newQuestionType,
        category: newCategory,
        isActive: true,
        displayOrder: questions.length + 1
      }

      // Add specific fields based on the type
      if (newQuestionType === 'content') {
        newQuestionData.contentType = newContentType
        if (newContentUrl.trim()) newQuestionData.contentUrl = newContentUrl.trim()
        if (newContentBody.trim()) newQuestionData.contentBody = newContentBody.trim()
      } else if (newQuestionType === 'choice' || newQuestionType === 'multi_choice') {
        newQuestionData.options = newOptionsText.split(',').map(opt => ({
          label: opt.trim(),
          value: opt.trim()
        })).filter(opt => opt.label !== '')
      }

      await addQuestion(newQuestionData)
      
      // Reset form upon success
      setNewQuestionText('')
      setNewQuestionType('emoji')
      setNewCategory('general')
      setNewOptionsText('')
      setNewContentType('info_text')
      setNewContentUrl('')
      setNewContentBody('')
      
      await loadQuestions()
      alert('הנתונים נשמרו בהצלחה!')
    } catch (error) {
      console.error("Error adding question:", error)
      alert('שגיאה בשמירת הנתונים. ודא שאתה מחובר ושיש הרשאות מתאימות.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* System Recommendations Warning */}
      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 items-start animate-in fade-in">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-1">💡 המלצת המערכת למשוב אפקטיבי:</strong>
            <ul className="list-disc list-inside text-sm space-y-1">
              {totalQuestionsCount > 3 && <li>כדאי לשאול מקסימום 3 שאלות כדי לא לעייף את המטופל.</li>}
              {openQuestionsCount > 1 && <li>מומלץ לכלול מקסימום שאלה פתוחה אחת (טקסט חופשי).</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Add New Question / Content Form */}
      <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Input 
            type="text" 
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder={newQuestionType === 'content' ? "כותרת שקף המידע (למשל: ברוכים הבאים למחלקה)" : "הזן שאלה חדשה (למשל: איך היית מדרג את השירות?)"}
            className="h-12 md:col-span-6"
          />
          <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}>
            <SelectTrigger className="h-12 md:col-span-3 border-[#e8e7f5]"><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="admission">👋 שלב קבלה</SelectItem>
              <SelectItem value="during">🛏️ מהלך אשפוז</SelectItem>
              <SelectItem value="discharge">🏠 לקראת שחרור</SelectItem>
              <SelectItem value="general">⭐ כללי</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="h-12 md:col-span-3 border-[#e8e7f5]"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="emoji">😊 אימוג'י (1-5)</SelectItem>
              <SelectItem value="stars">⭐ כוכבים (1-5)</SelectItem>
              <SelectItem value="choice">🔘 בחירה יחידה</SelectItem>
              <SelectItem value="multi_choice">✅ בחירה מרובה</SelectItem>
              <SelectItem value="open_text">📝 טקסט חופשי</SelectItem>
              <SelectItem value="content">📺 שקף מידע ותוכן</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Options Input for Choices */}
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
          </div>
        )}

        {/* Dynamic Inputs for Content Block */}
        {newQuestionType === 'content' && (
          <div className="p-4 bg-[#f0f9f9] rounded-xl border border-dashed border-[#2a7c7c]/40 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#2a7c7c]">
              <Info className="w-4 h-4" />
              <span className="text-sm font-bold">הגדרות שקף מידע למטופל</span>
            </div>
            
            <Select value={newContentType} onValueChange={(v: ContentType) => setNewContentType(v)}>
              <SelectTrigger className="w-full md:w-64 bg-white"><SelectValue placeholder="סוג התוכן" /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="info_text"><div className="flex items-center gap-2"><AlignLeft className="w-4 h-4" /> טקסט בלבד</div></SelectItem>
                <SelectItem value="image"><div className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> תמונה + טקסט</div></SelectItem>
                <SelectItem value="video"><div className="flex items-center gap-2"><Video className="w-4 h-4" /> סרטון וידאו</div></SelectItem>
              </SelectContent>
            </Select>

            {(newContentType === 'image' || newContentType === 'video') && (
              <Input 
                type="url" 
                value={newContentUrl}
                onChange={(e) => setNewContentUrl(e.target.value)}
                placeholder={newContentType === 'image' ? "הדבק קישור לתמונה (URL)" : "הדבק קישור לסרטון (URL)"}
                className="w-full bg-white"
              />
            )}

            <textarea 
              value={newContentBody}
              onChange={(e) => setNewContentBody(e.target.value)}
              placeholder="טקסט הנחיות מורחב למטופל (אופציונלי)"
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]"
            />
          </div>
        )}

        <Button 
          onClick={handleAdd} 
          disabled={isSubmitting || !newQuestionText} 
          className="bg-[#2a7c7c] hover:bg-[#236969] text-white w-full h-12 font-bold transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 ml-2" /> {isSubmitting ? 'שומר נתונים...' : 'הוסף למחלקה'}
        </Button>
      </div>

      {/* List of Questions */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-[#a8a6c4] text-[#6b6890]">
            <p className="text-lg">אין עדיין שאלות במחלקה זו.</p>
          </div>
        ) : (
          (() => {
            let questionCounter = 0;
            
            // Define strict chronological order weights for categories
            const categoryOrder: Record<string, number> = {
              admission: 1,
              during: 2,
              discharge: 3,
              general: 4
            };

            return questions
              .sort((a, b) => {
                const weightA = categoryOrder[a.category || 'general'] || 4;
                const weightB = categoryOrder[b.category || 'general'] || 4;
                if (weightA !== weightB) return weightA - weightB;
                return (a.displayOrder || 0) - (b.displayOrder || 0);
              })
              .map((q) => {
                const isContent = q.questionType === 'content';
                if (!isContent) {
                  questionCounter++;
                }
                const currentNumber = questionCounter;
                return (
                  <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border border-[#e8e7f5] shadow-sm group hover:border-[#2a7c7c] transition-all">
                    <div className="flex items-start md:items-center gap-4">
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${isContent ? 'bg-[#e6f4f4] text-[#2a7c7c]' : 'bg-[#f7f7fc] text-[#6b6890]'}`}>
                        {isContent ? <Info className="w-4 h-4" /> : currentNumber}
                      </div>
                      <div>
                        <span className="font-bold text-[#1e1c4a] block">{q.questionText}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">
                            {q.category === 'admission' ? 'קבלה' : q.category === 'during' ? 'אשפוז' : q.category === 'discharge' ? 'שחרור' : 'כללי'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${isContent ? 'bg-[#f0f9f9] text-[#1a5c5c] border-[#1a5c5c]/10' : 'bg-green-50 text-green-700 border-green-200/60'}`}>
                            {isContent ? 'שקף מידע' : 'שאלת משוב'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { if(confirm('למחוק פריט זה?')) deleteQuestion(q.id).then(loadQuestions) }}
                      className="text-[#a8a6c4] hover:text-red-500 hover:bg-red-50 self-end md:self-auto mt-2 md:mt-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              });
          })()
        )}
      </div>
    </div>
  )
}
