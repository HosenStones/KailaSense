'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, updateQuestion } from '@/lib/firebase/firestore'
import { CATEGORIES, QUESTION_TYPES, getCategoryLabel, renderTypeLabelWithIcon, sortQuestions } from '@/lib/constants'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Trash2, ListPlus, BookOpen, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newCategory, setNewCategory] = useState<QuestionCategory>('general')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [newContentType, setNewContentType] = useState<ContentType>('info_text')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  
  // Accordion state - Default closed for all categories
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})

  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(sortQuestions(data))
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadQuestions() }, [departmentId])

  const toggleCat = (id: string) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));

  const resetForm = () => {
    setNewQuestionText(''); setNewQuestionType('emoji'); setNewCategory('general');
    setNewOptionsText(''); setNewContentType('info_text'); setNewContentUrl('');
    setNewContentBody(''); setEditingQuestionId(null);
  }

  const handleAdd = async (overrideData?: any) => {
    if (!overrideData && (!newQuestionText.trim() || !departmentId)) return
    setIsSubmitting(true)
    try {
      const baseData = overrideData || {
        departmentId, questionText: newQuestionText, questionType: newQuestionType,
        category: newCategory, isActive: true, displayOrder: questions.length + 1
      }
      if (!overrideData) {
        if (newQuestionType === 'content') {
          baseData.contentType = newContentType;
          if (newContentUrl.trim()) baseData.contentUrl = newContentUrl.trim();
          if (newContentBody.trim()) baseData.contentBody = newContentBody.trim();
        } else if (newQuestionType === 'choice' || newQuestionType === 'multi_choice') {
          baseData.options = newOptionsText.split(',').map((opt: string) => ({ label: opt.trim(), value: opt.trim() })).filter((opt: any) => opt.label !== '');
        }
      }
      if (editingQuestionId && !overrideData) await updateQuestion(editingQuestionId, baseData);
      else await addQuestion(baseData);
      resetForm();
      await loadQuestions();
    } catch (error) {} finally { setIsSubmitting(false); }
  }

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q.id); setNewQuestionText(q.questionText);
    setNewQuestionType(q.questionType); setNewCategory(q.category || 'general');
    if (q.questionType === 'content') {
      setNewContentType(q.contentType || 'info_text'); 
      setNewContentUrl(q.contentUrl || ''); 
      setNewContentBody(q.contentBody || '');
    } else {
      setNewContentType('info_text'); setNewContentUrl(''); setNewContentBody('');
    }
    setNewOptionsText(q.options && q.options.length > 0 ? q.options.map(o => o.label).join(', ') : '');
    
    // Smooth scroll to form
    setTimeout(() => { 
      document.getElementById('question-creator-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* The main workspace block */}
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-6">
        
        <h3 className="text-[#1e1c4a] text-lg font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#2a7c7c]" /> תכנים ושאלות במחלקה
        </h3>

        {/* Creator Form */}
        <div id="question-creator-form" className={`p-5 rounded-xl border shadow-sm space-y-4 ${editingQuestionId ? 'bg-white border-2 border-[#2a7c7c]' : 'bg-[#f7f7fc] border-[#e8e7f5]'}`}>
          {editingQuestionId && (
            <div className="flex items-center justify-between text-[#2a7c7c] text-xs font-bold mb-2">
              <span>✏️ מצב עריכה לשאלה קיימת</span>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-[11px] bg-white border border-[#e8e7f5]">ביטול עריכה</Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <Input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder={newQuestionType === 'content' ? "כותרת שקף המידע" : "הזינו שאלה חדשה באופן עצמאי..."} className="h-10 md:col-span-6 text-xs bg-white border-[#e8e7f5]" />
            <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}>
              <SelectTrigger className="h-10 md:col-span-3 text-xs bg-white border-[#e8e7f5]"><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
              <SelectContent dir="rtl">
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
              <SelectTrigger className="h-10 md:col-span-3 text-xs bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                {QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
            <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-[#2a7c7c] text-xs font-bold"><ListPlus className="w-4 h-4" /><span>אפשרויות תשובה (מופרדות בפסיק)</span></div>
              <Input type="text" value={newOptionsText} onChange={(e) => setNewOptionsText(e.target.value)} className="w-full text-xs h-9 bg-white" />
            </div>
          )}

          {newQuestionType === 'content' && (
            <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
              <Select value={newContentType} onValueChange={(v: ContentType) => setNewContentType(v)}>
                <SelectTrigger className="w-full text-xs h-9 bg-white border-[#e8e7f5]"><SelectValue placeholder="סוג התוכן" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="info_text" className="text-xs">📝 טקסט בלבד</SelectItem>
                  <SelectItem value="image" className="text-xs">🖼️ תמונה + טקסט</SelectItem>
                  <SelectItem value="video" className="text-xs">🎬 סרטון וידאו</SelectItem>
                </SelectContent>
              </Select>
              {(newContentType === 'image' || newContentType === 'video') && ( <Input type="url" value={newContentUrl} onChange={(e) => setNewContentUrl(e.target.value)} placeholder="קישור ישיר למדיה (URL)" className="w-full text-xs h-9 text-left bg-white border-[#e8e7f5]" dir="ltr" /> )}
              <textarea value={newContentBody} onChange={(e) => setNewContentBody(e.target.value)} placeholder="טקסט תוכן השקף" className="w-full min-h-[80px] p-2.5 rounded-md border border-[#e8e7f5] text-xs outline-none focus:border-[#2a7c7c]" />
            </div>
          )}

          <Button onClick={() => handleAdd()} disabled={isSubmitting || !newQuestionText} className="bg-[#2a7c7c] hover:bg-[#206060] text-white w-full h-10 text-xs font-bold rounded-xl">
            {editingQuestionId ? 'שמור שינויים' : 'הוסף פריט למחלקה'}
          </Button>
        </div>

        {/* Existing Questions Accordion Display */}
        <div className="space-y-4">
          {questions.length === 0 ? <div className="text-center p-8 text-slate-400 text-xs">אין שאלות במחלקה.</div> : 
            CATEGORIES.map((cat) => {
              const filteredItems = questions.filter(item => item.category === cat.id);
              if (filteredItems.length === 0) return null;
              const isExpanded = expandedCats[cat.id] ?? false; // סגור בדיפולט

              return (
                <div key={cat.id} className="bg-white rounded-xl border border-[#e8e7f5] shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-[#f7f7fc] border-b border-[#e8e7f5] cursor-pointer w-full hover:bg-slate-50 transition-colors" onClick={() => toggleCat(cat.id)}>
                    <h4 className="text-sm font-bold text-[#1e1c4a] flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#2a7c7c]"/> : <ChevronDown className="w-4 h-4 text-[#2a7c7c]"/>}
                      {cat.label} ({filteredItems.length})
                    </h4>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={(e) => { e.stopPropagation(); toggleCat(cat.id); }}>
                      {isExpanded ? 'סגור' : 'פתח'}
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      {filteredItems.map((q) => (
                        <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-[#f0f9f9]/50 border border-[#e8e7f5] hover:border-[#b2dfdf] transition-all">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white text-slate-600 border border-[#e8e7f5] flex items-center">{renderTypeLabelWithIcon(q.questionType, q.contentType)}</span>
                            </div>
                            <span className="text-[#1e1c4a] text-sm font-bold">{q.questionText}</span>
                          </div>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(q)} className="text-slate-400 hover:text-[#2a7c7c] h-8 px-2"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { if(confirm('למחוק פריט זה?')) deleteQuestion(q.id).then(loadQuestions) }} className="text-slate-400 hover:text-red-500 h-8 px-2"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  )
}
