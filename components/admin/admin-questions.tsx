'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, getAllDepartments, updateQuestion, getGlobalQuestions } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Plus, Trash2, ListPlus, Image as ImageIcon, Video, AlignLeft, Info, BookOpen, Pencil, X } from 'lucide-react'

export function AdminQuestions({ departmentId }: { departmentId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [departmentName, setDepartmentName] = useState('')
  const [globalBank, setGlobalBank] = useState<any[]>([])
  
  // Form states for creating or editing questions
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
      setQuestions(data)

      const bankData = await getGlobalQuestions()
      setGlobalBank(bankData)

      const allDepts = await getAllDepartments()
      const currentDept = allDepts.find(d => d.id === departmentId)
      if (currentDept) {
        setDepartmentName(currentDept.name)
      }
    } catch (e) {
      console.error("Error loading questions:", e)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [departmentId])

  const openQuestionsCount = questions.filter(q => q.questionType === 'open_text').length;
  const totalQuestionsCount = questions.filter(q => q.questionType !== 'content').length;
  const showWarning = totalQuestionsCount > 3 || openQuestionsCount > 1;

  const getMatchedTag = (name: string): string => {
    if (!name) return 'כללי';
    if (name.includes('יולדות')) return 'יולדות';
    if (name.includes('מיון')) return 'מיון';
    if (name.includes('אורתופדיה')) return 'אורתופדיה';
    if (name.includes('קרדיולוגיה')) return 'קרדיולוגיה';
    if (name.includes('עיניים')) return 'עיניים';
    if (name.includes('נשים')) return 'נשים';
    return 'כללי';
  }

  const currentTargetTag = getMatchedTag(departmentName)

  const resetForm = () => {
    setNewQuestionText('')
    setNewQuestionType('emoji')
    setNewCategory('general')
    setNewOptionsText('')
    setNewContentType('info_text')
    setNewContentUrl('')
    setNewContentBody('')
    setEditingQuestionId(null)
  }

  const handleAdd = async (overrideData?: any, skipReload = false) => {
    if (!overrideData && (!newQuestionText.trim() || !departmentId)) return
    setIsSubmitting(true)

    try {
      const baseData = overrideData || {
        departmentId,
        questionText: newQuestionText,
        questionType: newQuestionType,
        category: newCategory,
        isActive: true,
        displayOrder: questions.length + 1
      }

      if (!overrideData) {
        if (newQuestionType === 'content') {
          baseData.contentType = newContentType
          if (newContentUrl.trim()) baseData.contentUrl = newContentUrl.trim()
          if (newContentBody.trim()) baseData.contentBody = newContentBody.trim()
        } else if (newQuestionType === 'choice' || newQuestionType === 'multi_choice') {
          if (!newOptionsText.trim()) {
            alert('Please enter choice options separated by comma.')
            setIsSubmitting(false)
            return
          }
          baseData.options = newOptionsText.split(',').map((opt: string) => ({
            label: opt.trim(), value: opt.trim()
          })).filter((opt: {label: string, value: string}) => opt.label !== '')
        }
      }

      if (editingQuestionId && !overrideData) {
        await updateQuestion(editingQuestionId, baseData)
      } else {
        await addQuestion(baseData)
      }
      
      resetForm()
      if (!skipReload) {
        await loadQuestions()
      }
    } catch (error) {
      console.error("Error saving question:", error)
      alert('Failed to save data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddFromBank = async (bankItem: any, category: string, skipReload = false) => {
    if (!departmentId) return
    
    const baseData: any = {
      departmentId,
      questionText: bankItem.text,
      questionType: bankItem.type,
      category: category,
      isActive: true,
      displayOrder: questions.length + 1
    }

    if (bankItem.type === 'content') {
      baseData.contentType = bankItem.contentType || 'info_text'
      if (bankItem.contentBody) baseData.contentBody = bankItem.contentBody
      if (bankItem.contentUrl) baseData.contentUrl = bankItem.contentUrl
    } else if (bankItem.options) {
      baseData.options = bankItem.options.map((opt: string) => ({ label: opt, value: opt }))
    }

    await handleAdd(baseData, skipReload)
  }

  const handleAddAllInCategory = async (items: any[], category: string) => {
    setIsSubmitting(true)
    try {
      const toAdd = items.filter(item => !questions.some(q => q.questionText === item.text))
      for (const item of toAdd) {
        await handleAddFromBank(item, category, true)
      }
      await loadQuestions()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAllInCategory = async (category: string) => {
    if (!confirm('Are you sure you want to remove all questions added from this category?')) return;
    setIsSubmitting(true)
    try {
      const toRemove = questions.filter(q => q.category === category)
      for (const q of toRemove) {
        await deleteQuestion(q.id)
      }
      await loadQuestions()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q.id)
    setNewQuestionText(q.questionText)
    setNewQuestionType(q.questionType)
    setNewCategory(q.category || 'general')
    
    if (q.questionType === 'content') {
      setNewContentType(q.contentType || 'info_text')
      setNewContentUrl(q.contentUrl || '')
      setNewContentBody(q.contentBody || '')
    } else {
      setNewContentType('info_text')
      setNewContentUrl('')
      setNewContentBody('')
    }
    
    if (q.options && q.options.length > 0) {
      setNewOptionsText(q.options.map(o => o.label).join(', '))
    } else {
      setNewOptionsText('')
    }
    
    // Scroll to the edit form section instead of top of the page
    setTimeout(() => {
      const formElement = document.getElementById('question-creator-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  const renderCategoryLabel = (cat: string) => {
    const catMap: Record<string, string> = {
      admission: '👋 שלב קבלה',
      during: '🛏️ מהלך אשפוז',
      discharge: '🏠 לקראת שחרור',
      after_discharge: '⏱️ 24 שעות לאחר שחרור',
      general: '⭐ כללי'
    };
    
    return (
      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
        {catMap[cat] || catMap['general']}
      </span>
    )
  }

  const renderTypeLabel = (type: string, contentType?: string) => {
    let icon = null;
    let text = '';
    
    if (type === 'content') {
      text = '📺 שקף מידע';
      if (contentType === 'video') icon = <Video className="w-3 h-3 mr-1 inline" />;
      if (contentType === 'image') icon = <ImageIcon className="w-3 h-3 mr-1 inline" />;
    } else {
      if (type === 'emoji') text = "😊 אימוג'י";
      if (type === 'stars') text = "⭐ כוכבים";
      if (type === 'choice') text = "🔘 בחירה יחידה";
      if (type === 'multi_choice') text = "✅ בחירה מרובה";
      if (type === 'open_text') text = "📝 טקסט חופשי";
    }

    return (
      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 flex items-center">
        {text}
        {icon}
      </span>
    )
  }

  const categoriesToRender = ['admission', 'during', 'discharge', 'after_discharge', 'general'];

  return (
    <div className="space-y-6" dir="rtl">
      
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

      {/* Database Driven Question Bank Area */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowBank(!showBank)}
          className="w-full flex items-center justify-between p-4 font-bold text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <span>בנק שאלות ותובנות לבחירה מהירה ({departmentName || 'טוען...'})</span>
          </div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">
            {showBank ? 'סגור בנק שאלות' : 'פתח ובחר פריט מוכן'}
          </span>
        </button>

        {showBank && (
          <div className="p-4 bg-secondary/30 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto animate-in fade-in duration-200">
            {categoriesToRender.map((cat) => {
              const filteredItems = globalBank.filter(
                item => item.category === cat && (item.tag === 'כללי' || item.tag === currentTargetTag)
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-2 bg-card p-3 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider">
                      {cat === 'admission' ? '👋 קבלה והתמצאות' : 
                       cat === 'during' ? '🛏️ יחס, תקשורת ואשפוז' : 
                       cat === 'discharge' ? '🏠 תחושת מוכנות וארגון לשחרור' : 
                       cat === 'after_discharge' ? '⏱️ 24 שעות לאחר שחרור' : '⭐ חוויה כוללת והמשכיות'}
                    </h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => handleAddAllInCategory(filteredItems, cat)}>הוסף הכל</Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => handleRemoveAllInCategory(cat)}>הסר הכל</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {filteredItems.map((item, idx) => {
                      const isAdded = questions.some(q => q.questionText === item.text);
                      
                      return (
                        <div key={item.id || idx} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/40 border border-transparent hover:border-primary/20 transition-all group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                {renderCategoryLabel(cat)}
                                {renderTypeLabel(item.type, item.contentType)}
                              </div>
                              <span className="text-foreground text-sm font-medium leading-tight">{item.text}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant={isAdded ? "secondary" : "ghost"}
                              disabled={isAdded}
                              onClick={() => handleAddFromBank(item, cat)}
                              className={`h-8 text-xs px-3 font-bold shrink-0 rounded-lg ${isAdded ? 'text-slate-400 bg-slate-100' : 'text-primary hover:bg-primary/10 cursor-pointer'}`}
                            >
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
            {globalBank.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-6 text-muted-foreground">
                The bank is empty. Default questions can be loaded from the system management screen.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual question creation form */}
      <div id="question-creator-form" className={`p-5 rounded-2xl border shadow-sm space-y-4 transition-all ${editingQuestionId ? 'bg-white border-2 border-primary shadow-md' : 'bg-card border-border'}`}>
        {editingQuestionId && (
          <div className="flex items-center justify-between text-primary font-bold mb-2">
            <span>✏️ מצב עריכה לשאלה קיימת</span>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 text-xs cursor-pointer bg-slate-100 hover:bg-slate-200">
              <X className="w-4 h-4 ml-1" /> ביטול עריכה
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <Input 
            type="text" 
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder={newQuestionType === 'content' ? "כותרת שקף המידע (למשל: ברוכים הבאים למחלקה)" : "הזן שאלה חדשה באופן עצמאי..."}
            className="h-12 md:col-span-6 bg-background border-border text-foreground"
          />
          <Select value={newCategory} onValueChange={(v: QuestionCategory) => setNewCategory(v)}>
            <SelectTrigger className="h-12 md:col-span-3 border-border bg-background text-foreground cursor-pointer"><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
            <SelectContent dir="rtl" className="bg-popover border-border">
              <SelectItem value="admission" className="cursor-pointer">👋 שלב קבלה</SelectItem>
              <SelectItem value="during" className="cursor-pointer">🛏️ מהלך אשפוז</SelectItem>
              <SelectItem value="discharge" className="cursor-pointer">🏠 לקראת שחרור</SelectItem>
              <SelectItem value="after_discharge" className="cursor-pointer">⏱️ 24 שעות לאחר שחרור</SelectItem>
              <SelectItem value="general" className="cursor-pointer">⭐ כללי</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newQuestionType} onValueChange={(v: QuestionType) => setNewQuestionType(v)}>
            <SelectTrigger className="h-12 md:col-span-3 border-border bg-background text-foreground cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl" className="bg-popover border-border">
              <SelectItem value="emoji" className="cursor-pointer">😊 אימוג'י (1 עד 5)</SelectItem>
              <SelectItem value="stars" className="cursor-pointer">⭐ כוכבים (1 עד 5)</SelectItem>
              <SelectItem value="choice" className="cursor-pointer">🔘 בחירה יחידה</SelectItem>
              <SelectItem value="multi_choice" className="cursor-pointer">✅ בחירה מרובה</SelectItem>
              <SelectItem value="open_text" className="cursor-pointer">📝 טקסט חופשי</SelectItem>
              <SelectItem value="content" className="cursor-pointer">📺 שקף מידע ותוכן</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(newQuestionType === 'choice' || newQuestionType === 'multi_choice') && (
          <div className="p-4 bg-secondary rounded-xl border border-dashed border-primary/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <ListPlus className="w-4 h-4" />
              <span className="text-sm font-bold">הגדרת אפשרויות תשובה שיוצגו למטופל</span>
            </div>
            <Input 
              type="text" 
              value={newOptionsText}
              onChange={(e) => setNewOptionsText(e.target.value)}
              placeholder="הכנס אפשרויות מופרדות בפסיק (למשל: תזונאית, עובדת סוציאלית)"
              className="w-full bg-background border-border text-foreground"
            />
          </div>
        )}

        {newQuestionType === 'content' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <Info className="w-4 h-4" />
              <span className="text-sm font-bold">הגדרות שקף מידע והנחיות למטופל</span>
            </div>
            
            <Select value={newContentType} onValueChange={(v: ContentType) => setNewContentType(v)}>
              <SelectTrigger className="w-full md:w-64 bg-background border-border text-foreground cursor-pointer"><SelectValue placeholder="סוג התוכן" /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                <SelectItem value="info_text" className="cursor-pointer"><div className="flex items-center gap-2"><AlignLeft className="w-4 h-4" /> טקסט בלבד</div></SelectItem>
                <SelectItem value="image" className="cursor-pointer"><div className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> תמונה + טקסט</div></SelectItem>
                <SelectItem value="video" className="cursor-pointer"><div className="flex items-center gap-2"><Video className="w-4 h-4" /> סרטון וידאו</div></SelectItem>
              </SelectContent>
            </Select>

            {(newContentType === 'image' || newContentType === 'video') && (
              <Input 
                type="url" 
                value={newContentUrl}
                onChange={(e) => setNewContentUrl(e.target.value)}
                placeholder={newContentType === 'image' ? "הדבק קישור ישיר לתמונה (URL)" : "הדבק קישור לסרטון או יוטיוב (URL)"}
                className="w-full bg-background border-border text-foreground"
              />
            )}

            <textarea 
              value={newContentBody}
              onChange={(e) => setNewContentBody(e.target.value)}
              placeholder="טקסט הנחיות מורחב למטופל (אופציונלי, יופיע מתחת למדיה)"
              className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <Button 
          onClick={() => handleAdd()} 
          disabled={isSubmitting || !newQuestionText} 
          className="bg-primary hover:bg-primary/95 text-primary-foreground w-full h-12 font-bold transition-all cursor-pointer rounded-xl"
        >
          {editingQuestionId ? (
            <>שמור שינויים</>
          ) : (
            <><Plus className="w-5 h-5 ml-2" /> {isSubmitting ? 'שומר נתונים...' : 'הוסף פריט למחלקה'}</>
          )}
        </Button>
      </div>

      {/* Render active department questions */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
            <p className="text-lg">אין עדיין פריטים מוגדרים במחלקה זו.</p>
          </div>
        ) : (
          (() => {
            let questionCounter = 0;
            const categoryOrder: Record<string, number> = {
              admission: 1,
              during: 2,
              discharge: 3,
              after_discharge: 4,
              general: 5
            };

            return questions
              .sort((a, b) => {
                const weightA = categoryOrder[a.category || 'general'] || 5;
                const weightB = categoryOrder[b.category || 'general'] || 5;
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
                  <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm group hover:border-primary transition-all">
                    <div className="flex items-start md:items-center gap-4">
                      <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold bg-slate-100 text-slate-500">
                        {isContent ? <Info className="w-4 h-4" /> : currentNumber}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{q.questionText}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {renderCategoryLabel(q.category || 'general')}
                          {renderTypeLabel(q.questionType, q.contentType)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 self-end md:self-auto mt-2 md:mt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(q)}
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="ערוך שאלה"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { if(confirm('למחוק פריט זה מהרשימה?')) deleteQuestion(q.id).then(loadQuestions) }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="מחק שאלה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              });
          })()
        )}
      </div>
    </div>
  )
}
