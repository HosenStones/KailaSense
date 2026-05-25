'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, getGlobalQuestions, addQuestion, deleteQuestion, updateQuestion } from '@/lib/firebase/firestore'
import { CATEGORIES, QUESTION_TYPES, renderTypeLabelWithIcon, sortQuestions } from '@/lib/constants'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Trash2, ListPlus, BookOpen, Pencil, ChevronDown, ChevronUp, Library, Check } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [bankQuestions, setBankQuestions] = useState<any[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('emoji')
  const [newCategory, setNewCategory] = useState<QuestionCategory>('general')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [newContentType, setNewContentType] = useState<ContentType>('info_text')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentBody, setNewContentBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})
  const [expandedBankCats, setExpandedBankCats] = useState<Record<string, boolean>>({})
  const [isBankOpen, setIsBankOpen] = useState(false)

  const loadQuestions = async () => {
    if (!departmentId) return;
    const data = await getQuestionsByDepartment(departmentId); setQuestions(sortQuestions(data));
    const bankData = await getGlobalQuestions(); setBankQuestions(sortQuestions(bankData));
  }
  useEffect(() => { loadQuestions() }, [departmentId])
  const toggleCat = (id: string) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));
  const toggleBankCat = (id: string) => setExpandedBankCats(prev => ({...prev, [id]: !prev[id]}));


const handleAdd = async (overrideData?: any) => {
    if (!overrideData && (!newQuestionText.trim() || !departmentId)) return
    setIsSubmitting(true)
    try {
      const baseData = overrideData || { departmentId, questionText: newQuestionText, questionType: newQuestionType, category: newCategory, isActive: true, displayOrder: questions.length + 1 }
      if (!overrideData && newQuestionType === 'content') { baseData.contentType = newContentType; baseData.contentUrl = newContentUrl; baseData.contentBody = newContentBody; }
      else if (!overrideData && (newQuestionType === 'choice' || newQuestionType === 'multi_choice')) baseData.options = newOptionsText.split(',').map((opt: string) => ({ label: opt.trim(), value: opt.trim() }));
      
      if (editingQuestionId && !overrideData) await updateQuestion(editingQuestionId, baseData);
      else await addQuestion(baseData);
      setEditingQuestionId(null); setNewQuestionText(''); await loadQuestions();
    } finally { setIsSubmitting(false); }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#e8e7f5] pb-4">
          <h3 className="text-[#1e1c4a] font-bold text-lg flex items-center gap-2"><Library className="w-5 h-5 text-[#2a7c7c]" /> מאגר השאלות</h3>
          <Button variant="outline" size="sm" onClick={() => setIsBankOpen(!isBankOpen)} className="h-8 text-xs bg-white border-[#e8e7f5]">{isBankOpen ? 'הסתר מאגר' : 'הצג שאלות'}</Button>
        </div>
        {isBankOpen && (
          <div className="space-y-4 pt-2">
            {CATEGORIES.map(cat => {
              const catItems = bankQuestions.filter(q => q.category === cat.id && (q.tag === 'כללי' || q.tag === departmentId));
              if (catItems.length === 0) return null;
              const isExpanded = expandedBankCats[cat.id] ?? false;
              return (
                <div key={`bank-${cat.id}`} className="bg-white rounded-xl border border-[#e8e7f5] shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-[#f7f7fc] cursor-pointer" onClick={() => toggleBankCat(cat.id)}>
                    <h4 className="text-sm font-bold text-[#1e1c4a] flex items-center gap-2">{isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>} {cat.label} ({catItems.length})</h4>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                      {catItems.map(q => {
                        const isAlreadyAdded = questions.some(ex => ex.questionText === q.text && ex.category === (q.category || 'general'));
                        return (
                          <div key={q.id} className="flex justify-between items-center p-3 border rounded-xl">
                            <span className="text-sm font-medium text-[#1e1c4a]">{q.text}</span>
                            {isAlreadyAdded ? <Button disabled size="sm" className="bg-emerald-100 text-emerald-700 h-7 text-[10px]"><Check className="w-3 h-3 ml-1" /> נוסף</Button> : 
                            <Button size="sm" onClick={() => handleAdd({ departmentId, questionText: q.text, questionType: q.type, category: q.category || 'general', options: q.options?.map((o:any)=>({label:o, value:o})), contentType: q.contentType, contentUrl: q.contentUrl, contentBody: q.contentBody, isActive: true, displayOrder: questions.length + 1 })} className="h-7 text-[10px] bg-[#2a7c7c]">+ הוספה</Button>}
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

      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-[#1e1c4a] text-lg font-bold mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#2a7c7c]" /> תכנים ושאלות במחלקה</h3>
        <div className={`p-5 rounded-xl border space-y-4 ${editingQuestionId ? 'border-2 border-[#2a7c7c]' : 'bg-[#f7f7fc] border-[#e8e7f5]'}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <Input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder="הזינו שאלה חדשה..." className="h-10 md:col-span-6 text-xs bg-white" />
            <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}><SelectTrigger className="h-10 md:col-span-3 text-xs bg-white"><SelectValue placeholder="סטטוס" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select>
            <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}><SelectTrigger className="h-10 md:col-span-3 text-xs bg-white"><SelectValue /></SelectTrigger><SelectContent>{QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={() => handleAdd()} disabled={isSubmitting || !newQuestionText} className="bg-[#2a7c7c] text-white w-full h-10 text-xs font-bold">{editingQuestionId ? 'שמור שינויים' : 'הוסף פריט למחלקה'}</Button>
        </div>
        <div className="space-y-4 pt-2">
          {CATEGORIES.map((cat) => {
            const filteredItems = questions.filter(item => item.category === cat.id);
            if (filteredItems.length === 0) return null;
            const isExpanded = expandedCats[cat.id] ?? false;
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-[#e8e7f5] overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-[#f7f7fc] cursor-pointer" onClick={() => toggleCat(cat.id)}>
                  <h4 className="text-sm font-bold text-[#1e1c4a]">{cat.label} ({filteredItems.length})</h4>
                </div>
                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {filteredItems.map((q: any) => (
                      <div key={q.id} className="flex justify-between items-center p-3 border rounded-xl">
                        <span className="text-sm font-medium text-[#1e1c4a]">{q.questionText}</span>
                        <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => { /* לוגיקה לעריכה */ }}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => { if(confirm('למחוק?')) deleteQuestion(q.id).then(loadQuestions) }}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
