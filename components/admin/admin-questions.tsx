'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, getAllDepartments, updateQuestion, getGlobalQuestions } from '@/lib/firebase/firestore'
import { CATEGORIES, QUESTION_TYPES, getCategoryLabel, renderTypeLabelWithIcon, sortQuestions } from '@/lib/constants'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Trash2, ListPlus, Info, BookOpen, Pencil, ChevronDown, ChevronUp } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [departmentName, setDepartmentName] = useState('')
  const [globalBank, setGlobalBank] = useState<any[]>([])
  
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newCategory, setNewCategory] = useState<QuestionCategory>('general')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [newContentType, setNewContentType] = useState<ContentType>('info_text')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBank, setShowBank] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  
  // הכל סגור בדיפולט גם פה
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})
  const [expandedBankCats, setExpandedBankCats] = useState<Record<string, boolean>>({})

  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(sortQuestions(data))
      const bankData = await getGlobalQuestions()
      setGlobalBank(sortQuestions(bankData))
      const allDepts = await getAllDepartments()
      const currentDept = allDepts.find(d => d.id === departmentId)
      if (currentDept) setDepartmentName(currentDept.name)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadQuestions() }, [departmentId])

  const toggleCat = (id: string) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));
  const toggleBankCat = (id: string) => setExpandedBankCats(prev => ({...prev, [id]: !prev[id]}));

  const openQuestionsCount = questions.filter(q => q.questionType === 'open_text').length;
  const totalQuestionsCount = questions.filter(q => q.questionType !== 'content').length;
  const showWarning = totalQuestionsCount > 3 || openQuestionsCount > 1;

  const currentTargetTag = departmentName ? (
    departmentName.includes('יולדות') ? 'יולדות' :
    departmentName.includes('מיון') ? 'מיון' :
    departmentName.includes('אורתופדיה') ? 'אורתופדיה' :
    departmentName.includes('קרדיולוגיה') ? 'קרדיולוגיה' :
    departmentName.includes('עיניים') ? 'עיניים' :
    departmentName.includes('נשים') ? 'נשים' : 'כללי'
  ) : 'כללי';

  const resetForm = () => {
    setNewQuestionText(''); setNewQuestionType('emoji'); setNewCategory('general');
    setNewOptionsText(''); setNewContentType('info_text'); setNewContentUrl('');
    setNewContentBody(''); setEditingQuestionId(null);
  }

  const handleAdd = async (overrideData?: any, skipReload = false) => {
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
      if (!skipReload) await loadQuestions();
    } catch (error) {} finally { setIsSubmitting(false); }
  }

  const handleAddFromBank = async (bankItem: any, category: string, skipReload = false) => {
    if (!departmentId) return;
    const baseData: any = { departmentId, questionText: bankItem.text, questionType: bankItem.type, category: category, isActive: true, displayOrder: questions.length + 1 };
    if (bankItem.type === 'content') {
      baseData.contentType = bankItem.contentType || 'info_text';
      if (bankItem.contentBody) baseData.contentBody = bankItem.contentBody;
      if (bankItem.contentUrl) baseData.contentUrl = bankItem.contentUrl;
    } else if (bankItem.options) {
      baseData.options = bankItem.options.map((opt: string) => ({ label: opt, value: opt }));
    }
    await handleAdd(baseData, skipReload);
  }

  const handleAddAllInCategory = async (items: any[], category: string) => {
    setIsSubmitting(true);
    try {
      const toAdd = items.filter(item => !questions.some(q => q.questionText === item.text));
      for (const item of toAdd) await handleAddFromBank(item, category, true);
      await loadQuestions();
    } finally { setIsSubmitting(false); }
  }

  const handleRemoveAllInCategory = async (category: string) => {
    if (!confirm('האם את בטוחה שברצונך להסיר את כל השאלות מקטגוריה זו?')) return;
    setIsSubmitting(true);
    try {
      const toRemove = questions.filter(q => q.category === category);
      for (const q of toRemove) await deleteQuestion(q.id);
      await loadQuestions();
    } finally { setIsSubmitting(false); }
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
    
    setTimeout(() => { 
      document.getElementById('question-creator-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  return (
    <div className="space-y-6" dir="rtl">
      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 items-start text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>המלצת המערכת למשוב אפקטיבי:</strong>
            <ul className="list-disc list-inside space-y-1 mt-1">
              {totalQuestionsCount > 3 && <li>כדאי לשאול מקסימום 3 שאלות כדי לא לעייף את המטופל.</li>}
              {openQuestionsCount > 1 && <li>מומלץ לכלול מקסימום שאלה פתוחה אחת (טקסט חופשי).</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <button onClick={() => setShowBank(!showBank)} className="w-full flex items-center justify-between p-4 font-bold text-foreground hover:bg-secondary/50 transition-colors cursor-pointer text-sm">
          <div className="flex items-center gap-2 text-slate-800"><BookOpen className="w-4 h-4 text-slate-800" /><span>מאגר שאלות מחלקתי</span></div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">{showBank ? 'סגור' : 'פתח'}</span>
        </button>

        {showBank && (
          <div className="p-4 bg-secondary/30 border-t border-border space-y-4 max-h-[600px] overflow-y-auto">
            {CATEGORIES.map((cat) => {
              const filteredItems = globalBank.filter(item => item.category === cat.id && (item.tag === 'כללי' || item.tag === currentTargetTag));
              if (filteredItems.length === 0) return null;
              const isExpanded = expandedBankCats[cat.id];
              return (
                <div key={cat.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-border cursor-pointer w-full hover:bg-slate-100/50 transition-colors" onClick={() => toggleBankCat(cat.id)}>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                      {cat.label} ({filteredItems.length})
                    </h4>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={() => toggleBankCat(cat.id)}>
                        {isExpanded ? 'סגור' : 'פתח'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleAddAllInCategory(filteredItems, cat.id)}>הוסף הכל</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleRemoveAllInCategory(cat.id)}>הסר הכל</Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-2 bg-white">
                      {filteredItems.map((item, idx) => {
                        const isAdded = questions.some(q => q.questionText === item.text && JSON.stringify(q.options || []) === JSON.stringify(item.options?.map((o: any) => ({ label: o, value: o })) || []));
                        return (
                          <div key={item.id || idx} className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/40 border hover:border-primary/20 transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white text-slate-600 border border-slate-200 flex items-center">{renderTypeLabelWithIcon(item.type, item.contentType)}</span>
                                </div>
                                <span className="text-slate-800 text-xs font-medium leading-tight">{item.text}</span>
                              </div>
                              <Button size="sm" variant={isAdded ? "secondary" : "ghost"} disabled={isAdded} onClick={() => handleAddFromBank(item, cat.id)} className={`h-7 text-[11px] px-2 rounded ${isAdded ? 'text-slate-400 bg-slate-100' : 'text-primary hover:bg-primary/10'}`}>
                                {isAdded ? '✓ נוסף' : '+ הוסף'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div id="question-creator-form" className={`p-5 rounded-2xl border shadow-sm space-y-4 ${editingQuestionId ? 'bg-white border-2 border-primary' : 'bg-card border-border'}`}>
        {editingQuestionId && (
          <div className="flex items-center justify-between text-primary text-xs font-bold mb-2">
            <span>✏️ מצב עריכה לשאלה קיימת במחלקה</span>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-[11px] bg-slate-100">ביטול עריכה</Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder={newQuestionType === 'content' ? "כותרת שקף המידע" : "הזינו שאלה חדשה באופן עצמאי..."} className="h-10 md:col-span-6 text-xs bg-white" />
          <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}>
            <SelectTrigger className="h-10 md:col-span-3 text-xs bg-white"><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
            <SelectContent dir="rtl">
              {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="h-10 md:col-span-3 text-xs bg-white"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              {QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-primary text-xs font-bold"><ListPlus className="w-4 h-4" /><span>אפשרויות תשובה (מופרדות בפסיק)</span></div>
            <Input type="text" value={newOptionsText} onChange={(e) => setNewOptionsText(e.target.value)} className="w-full text-xs h-9 bg-white" />
          </div>
        )}

        {newQuestionType === 'content' && (
          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
            <Select value={newContentType} onValueChange={(v: ContentType) => setNewContentType(v)}>
              <SelectTrigger className="w-full text-xs h-9 bg-white"><SelectValue placeholder="סוג התוכן" /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="info_text" className="text-xs">📝 טקסט בלבד</SelectItem>
                <SelectItem value="image" className="text-xs">🖼️ תמונה + טקסט</SelectItem>
                <SelectItem value="video" className="text-xs">🎬 סרטון וידאו</SelectItem>
              </SelectContent>
            </Select>
            {(newContentType === 'image' || newContentType === 'video') && ( <Input type="url" value={newContentUrl} onChange={(e) => setNewContentUrl(e.target.value)} placeholder="קישור ישיר למדיה (URL)" className="w-full text-xs h-9 text-left bg-white" dir="ltr" /> )}
            <textarea value={newContentBody} onChange={(e) => setNewContentBody(e.target.value)} placeholder="טקסט תוכן השקף" className="w-full min-h-[80px] p-2.5 rounded-md border text-xs outline-none focus:border-primary" />
          </div>
        )}

        <Button onClick={() => handleAdd()} disabled={isSubmitting || !newQuestionText} className="bg-primary hover:bg-primary/95 text-white w-full h-10 text-xs font-bold rounded-xl">
          {editingQuestionId ? 'שמור שינויים' : 'הוסף פריט למחלקה'}
        </Button>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? <div className="text-center p-8 text-slate-400 text-xs">אין פריטים במחלקה.</div> : 
          CATEGORIES.map((cat) => {
            const filteredItems = questions.filter(item => item.category === cat.id);
            if (filteredItems.length === 0) return null;
            const isExpanded = expandedCats[cat.id] ?? false; // סגור בדיפולט
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-border cursor-pointer w-full hover:bg-slate-100/50 transition-colors" onClick={() => toggleCat(cat.id)}>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    {cat.label} ({filteredItems.length})
                  </h4>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={(e) => { e.stopPropagation(); toggleCat(cat.id); }}>
                    {isExpanded ? 'סגור' : 'פתח'}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {filteredItems.map((q) => (
                      <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100 hover:border-primary/20 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white text-slate-600 border border-slate-200 flex items-center">{renderTypeLabelWithIcon(q.questionType, q.contentType)}</span>
                          </div>
                          <span className="text-slate-800 text-sm font-bold">{q.questionText}</span>
                        </div>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(q)} className="text-slate-400 hover:text-slate-700 h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { if(confirm('למחוק פריט זה?')) deleteQuestion(q.id).then(loadQuestions) }} className="text-slate-400 hover:text-destructive h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
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
  )
}
