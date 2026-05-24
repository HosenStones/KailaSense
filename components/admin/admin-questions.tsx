'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, getAllDepartments, updateQuestion, getGlobalQuestions } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Plus, Trash2, ListPlus, Image as ImageIcon, Video, AlignLeft, Info, BookOpen, Pencil, X } from 'lucide-react'

const CATEGORY_MAP: Record<string, string> = {
  admission: '👋 קבלה למחלקה',
  during: '🛏️ מהלך אשפוז',
  discharge: '🏠 לקראת שחרור',
  after_discharge: '⏱️ לאחר שחרור',
  general: '⭐ כללי'
};

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

  const loadQuestions = async () => {
    if (!departmentId) return;
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(data.sort((a,b) => a.questionText.localeCompare(b.questionText, 'he')))
      const bankData = await getGlobalQuestions()
      setGlobalBank(bankData.sort((a,b) => a.text.localeCompare(b.text, 'he')))
      const allDepts = await getAllDepartments()
      const currentDept = allDepts.find(d => d.id === departmentId)
      if (currentDept) setDepartmentName(currentDept.name)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { loadQuestions() }, [departmentId])

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
          if (!newOptionsText.trim()) { alert('נא להזין אפשרויות בחירה מופרדות בפסיקים.'); setIsSubmitting(false); return; }
          baseData.options = newOptionsText.split(',').map((opt: string) => ({ label: opt.trim(), value: opt.trim() })).filter((opt: any) => opt.label !== '');
        }
      }
      if (editingQuestionId && !overrideData) await updateQuestion(editingQuestionId, baseData);
      else await addQuestion(baseData);
      resetForm();
      if (!skipReload) await loadQuestions();
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
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
      setNewContentType(q.contentType || 'info_text'); setNewContentUrl(q.contentUrl || ''); setNewContentBody(q.contentBody || '');
    } else {
      setNewContentType('info_text'); setNewContentUrl(''); setNewContentBody('');
    }
    setNewOptionsText(q.options && q.options.length > 0 ? q.options.map(o => o.label).join(', ') : '');
    
    // חישוב מדויק לגלילה מעלה לאזור העריכה
    setTimeout(() => { 
      const el = document.getElementById('question-creator-form');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  }

  const renderTypeLabel = (type: string, contentType?: string) => {
    let icon = null, text = '';
    if (type === 'content') { text = '📺 שקף מידע'; if (contentType === 'video') icon = <Video className="w-3 h-3 mr-1 inline" />; if (contentType === 'image') icon = <ImageIcon className="w-3 h-3 mr-1 inline" />; }
    else {
      if (type === 'emoji') text = "😊 אימוג'י"; if (type === 'stars') text = "⭐ כוכבים"; if (type === 'choice') text = "🔘 בחירה יחידה"; if (type === 'multi_choice') text = "✅ בחירה מרובה"; if (type === 'open_text') text = "📝 טקסט חופשי";
    }
    return <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center">{text}{icon}</span>
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
          <div className="flex items-center gap-2 text-primary"><BookOpen className="w-4 h-4" /><span>מאגר שאלות</span></div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">{showBank ? 'סגור' : 'פתח'}</span>
        </button>

        {showBank && (
          <div className="p-4 bg-secondary/30 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
            {['admission', 'during', 'discharge', 'after_discharge', 'general'].map((cat) => {
              const filteredItems = globalBank.filter(item => item.category === cat && (item.tag === 'כללי' || item.tag === currentTargetTag));
              if (filteredItems.length === 0) return null;
              return (
                <div key={cat} className="space-y-2 bg-card p-3 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                    <h4 className="text-xs font-bold text-primary">{CATEGORY_MAP[cat]}</h4>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => handleAddAllInCategory(filteredItems, cat)}>הוסף הכל</Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => handleRemoveAllInCategory(cat)}>הסר הכל</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredItems.map((item, idx) => {
                      const isAdded = questions.some(q => q.questionText === item.text && JSON.stringify(q.options || []) === JSON.stringify(item.options?.map((o: any) => ({ label: o, value: o })) || []));
                      return (
                        <div key={item.id || idx} className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/40 border hover:border-primary/20 transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">{CATEGORY_MAP[cat]}</span>
                                {renderTypeLabel(item.type, item.contentType)}
                              </div>
                              <span className="text-slate-800 text-xs font-medium leading-tight">{item.text}</span>
                            </div>
                            <Button size="sm" variant={isAdded ? "secondary" : "ghost"} disabled={isAdded} onClick={() => handleAddFromBank(item, cat)} className={`h-7 text-[11px] px-2 rounded ${isAdded ? 'text-slate-400 bg-slate-100' : 'text-primary hover:bg-primary/10'}`}>
                              {isAdded ? '✓ נוסף' : '+ הוסף'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
          <Input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder={newQuestionType === 'content' ? "כותרת שקף המידע" : "הזינו שאלה חדשה באופן עצמאי..."} className="h-11 md:col-span-6 text-xs" />
          <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}>
            <SelectTrigger className="h-11 md:col-span-3 text-xs"><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="admission" className="text-xs">👋 קבלה למחלקה</SelectItem>
              <SelectItem value="during" className="text-xs">🛏️ מהלך אשפוז</SelectItem>
              <SelectItem value="discharge" className="text-xs">🏠 לקראת שחרור</SelectItem>
              <SelectItem value="after_discharge" className="text-xs">⏱️ לאחר שחרור</SelectItem>
              <SelectItem value="general" className="text-xs">⭐ כללי</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="h-11 md:col-span-3 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="emoji" className="text-xs">😊 אימוג'י (1 עד 5)</SelectItem>
              <SelectItem value="stars" className="text-xs">⭐ כוכבים (1 עד 5)</SelectItem>
              <SelectItem value="choice" className="text-xs">🔘 בחירה יחידה</SelectItem>
              <SelectItem value="multi_choice" className="text-xs">✅ בחירה מרובה</SelectItem>
              <SelectItem value="open_text" className="text-xs">📝 טקסט חופשי</SelectItem>
              <SelectItem value="content" className="text-xs">📺 שקף מידע ותוכן</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
          <div className="p-3 bg-secondary rounded-xl border border-dashed border-primary/30 space-y-2">
            <div className="flex items-center gap-2 text-primary text-xs font-bold"><ListPlus className="w-4 h-4" /><span>הגדרת אפשרויות תשובה שיוצגו למטופל</span></div>
            <Input type="text" value={newOptionsText} onChange={(e) => setNewOptionsText(e.target.value)} placeholder="הכניסו אפשרויות מופרדות בפסיק" className="w-full text-xs" />
          </div>
        )}

        {newQuestionType === 'content' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <Select value={newContentType} onValueChange={(v: ContentType) => setNewContentType(v)}>
              <SelectTrigger className="w-full text-xs"><SelectValue placeholder="סוג התוכן" /></SelectTrigger>
              <SelectContent dir="rtl"><SelectItem value="info_text" className="text-xs">טקסט בלבד</SelectItem><SelectItem value="image" className="text-xs">תמונה + טקסט</SelectItem><SelectItem value="video" className="text-xs">סרטון וידאו</SelectItem></SelectContent>
            </Select>
            {(newContentType === 'image' || newContentType === 'video') && ( <Input type="url" value={newContentUrl} onChange={(e) => setNewContentUrl(e.target.value)} placeholder="קישור ישיר למדיה (URL)" className="w-full text-xs" /> )}
            <textarea value={newContentBody} onChange={(e) => setNewContentBody(e.target.value)} placeholder="טקסט הנחיות מורחב למטופל" className="w-full min-h-[80px] p-2.5 rounded-xl border text-xs" />
          </div>
        )}

        <Button onClick={() => handleAdd()} disabled={isSubmitting || !newQuestionText} className="bg-primary hover:bg-primary/95 text-white w-full h-11 text-xs font-bold rounded-xl">
          {editingQuestionId ? 'שמור שינויים' : 'הוסף פריט למחלקה'}
        </Button>
      </div>

      <div className="space-y-2">
        {questions.length === 0 ? <div className="text-center p-8 text-slate-400 text-xs">אין פריטים במחלקה.</div> : 
          questions.sort((a, b) => (({ admission: 1, during: 2, discharge: 3, after_discharge: 4, general: 5 }[a.category || 'general'] || 5) - ({ admission: 1, during: 2, discharge: 3, after_discharge: 4, general: 5 }[b.category || 'general'] || 5))).map((q, idx) => (
            <div key={q.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-border text-xs shadow-sm hover:border-primary transition-all">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-500">{q.questionType === 'content' ? <Info className="w-3.5 h-3.5" /> : idx + 1}</div>
                <div>
                  <span className="font-bold text-slate-800 block">{q.questionText}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">{CATEGORY_MAP[q.category || 'general']}</span>
                    {renderTypeLabel(q.questionType, q.contentType)}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEditClick(q)} className="text-slate-400 hover:text-slate-700 h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { if(confirm('למחוק פריט זה?')) deleteQuestion(q.id).then(loadQuestions) }} className="text-slate-400 hover:text-destructive h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
