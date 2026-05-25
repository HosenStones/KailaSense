'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getQuestionsByDepartment, getGlobalQuestions, addQuestion, deleteQuestion, updateQuestion } from '@/lib/firebase/firestore'
import { CATEGORIES, QUESTION_TYPES, getCategoryLabel, renderTypeLabelWithIcon, sortQuestions } from '@/lib/constants'
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
    try {
      const data = await getQuestionsByDepartment(departmentId)
      setQuestions(sortQuestions(data))
      
      const bankData = await getGlobalQuestions()
      setBankQuestions(sortQuestions(bankData))
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadQuestions() }, [departmentId])

  const toggleCat = (id: string) => setExpandedCats(prev => ({...prev, [id]: !prev[id]}));
  const toggleBankCat = (id: string) => setExpandedBankCats(prev => ({...prev, [id]: !prev[id]}));

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

  const handleImportFromBank = async (bankQ: any) => {
    await handleAdd({
      departmentId,
      questionText: bankQ.text,
      questionType: bankQ.type,
      category: bankQ.category || 'general',
      options: bankQ.options?.map((opt: string) => ({ label: opt, value: opt })) || [],
      contentType: bankQ.contentType,
      contentUrl: bankQ.contentUrl,
      contentBody: bankQ.contentBody,
      isActive: true,
      displayOrder: questions.length + 1
    });
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
      
      {/* 1. Global Question Bank Block (Moved to Top) */}
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#e8e7f5] pb-4">
          <h3 className="text-[#1e1c4a] font-bold text-lg flex items-center gap-2">
            <Library className="w-5 h-5 text-[#2a7c7c]" /> מאגר השאלות
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsBankOpen(!isBankOpen)} className="h-8 text-xs bg-white border-[#e8e7f5]">
            {isBankOpen ? 'הסתר מאגר' : 'הצג שאלות'}
          </Button>
        </div>

        {isBankOpen && (
          <div className="space-y-4 pt
