'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, addQuestion, deleteQuestion, getAllDepartments } from '@/lib/firebase/firestore'
import type { Question, QuestionType, QuestionCategory, ContentType } from '@/lib/types'
import { Plus, Trash2, ListPlus, Image as ImageIcon, Video, AlignLeft, Info, BookOpen } from 'lucide-react'
import { PREDEFINED_QUESTION_BANK, type BankItem } from '@/lib/question-bank'

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
      if (currentDept) {
        setDepartmentName(currentDept.name)
      }
    } catch (e) {
      console.error("Failed to load questions or department name:", e)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [departmentId])

  const openQuestionsCount = questions.filter(q => q.questionType === 'open_text').length;
  const totalQuestionsCount = questions.filter(q => q.questionType !== 'content').length;
  const showWarning = totalQuestionsCount > 3 || openQuestionsCount > 1;

  // Extract core keyword for department auto matching
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

  const handleAdd = async (overrideData?: any) => {
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
            alert('חובה להזין אפשרויות תשובה מופרדות בפסיק.')
            setIsSubmitting(false)
            return
          }
          baseData.options = newOptionsText.split(',').map(opt => ({
            label: opt.trim(), value: opt.trim()
          })).filter(opt => opt.label !== '')
        }
      }

      await addQuestion(baseData)
      
      setNewQuestionText('')
      setNewQuestionType('emoji')
      setNewCategory('general')
      setNewOptionsText('')
      setNewContentType('info_text')
      setNewContentUrl('')
      setNewContentBody('')
      
      await loadQuestions()
    } catch (error) {
      console.error("Error adding item:", error)
      alert('שגיאה בשמירת הנתונים במערכת.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddFromBank = async (bankItem: BankItem, category: QuestionCategory) => {
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
      baseData.options = bankItem.options.map(opt => ({ label: opt, value: opt }))
    }

    await handleAdd(baseData)
  }

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

      {/* Global Question Bank Drawer with smart matching filter */}
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
            {(Object.keys(PREDEFINED_QUESTION_BANK) as QuestionCategory[]).map((cat) => {
              // Automatically filter bank items based on generalized vs matched specific tags
              const filteredItems = PREDEFINED_QUESTION_BANK[cat].filter(
                item => item.tag === 'כללי' || item.tag === currentTargetTag
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-2 bg-card p-3 rounded-xl border border-border shadow-sm">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-border pb-2 mb-3">
                    {cat === 'admission' ? '👋 קבלה והתמצאות' : 
                     cat === 'during' ? '🛏️ יחס, תקשורת ואשפוז' : 
                     cat === 'discharge' ? '🏠 תחושת מוכנות וארגון לשחרור' : 
                     cat === 'after_discharge' ? '⏱️ 24 שעות לאחר שחרור' : '⭐ חוויה כוללת והמשכיות'}
                  </h4>
                  <div className="space-y-2">
                    {filteredItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/40 border border-transparent hover:border-primary/20 transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.type === 'content' ? 'bg-accent text-accent-foreground' : 'bg-white text-muted-foreground border border-border'}`}>
                                {item.tag}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {item.type === 'content' ? 'שקף מידע' : 'שאלת משוב'}
                              </span>
                            </div>
                            <span className="text-foreground text-sm font-medium leading-tight">{item.text}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleAddFromBank(item, cat)}
                            className="h-8 text-xs text-primary hover:bg-primary/10 px-3 cursor-pointer font-bold shrink-0 rounded-lg"
                          >
                            + הוסף
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Questionnaire Creator Form */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
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
              placeholder="הכנס אפשרויות מופרדות בפסיק (למשל: רופא, אחות, צוות ניקיון)"
              className="w-full bg-background border-border text-foreground"
            />
          </div>
        )}

        {newQuestionType === 'content' && (
          <div className="p-4 bg-accent rounded-xl border border-dashed border-primary/40 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
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
          <Plus className="w-5 h-5 ml-2" /> {isSubmitting ? 'שומר נתונים...' : 'הוסף פריט למחלקה'}
        </Button>
      </div>

      {/* Render Categorized Items Layout */}
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
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${isContent ? 'bg-accent text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {isContent ? <Info className="w-4 h-4" /> : currentNumber}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{q.questionText}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded font-bold uppercase">
                            {q.category === 'admission' ? 'קבלה' : 
                             q.category === 'during' ? 'אשפוז' : 
                             q.category === 'discharge' ? 'לקראת שחרור' : 
                             q.category === 'after_discharge' ? 'שחרור (24ש\')' : 'כללי'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${isContent ? 'bg-accent text-primary border-primary/10' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {isContent ? 'שקף מידע' : 'שאלת משוב'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { if(confirm('למחוק פריט זה מהרשימה?')) deleteQuestion(q.id).then(loadQuestions) }}
                      className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 self-end md:self-auto mt-2 md:mt-0 cursor-pointer"
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
