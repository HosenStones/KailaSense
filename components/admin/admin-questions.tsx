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
            alert('חובה להזין אפשרויות תשובה מופרדות בפסיק.')
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
      alert('שגיאה בשמירת הנתונים במערכת.')
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
      baseData.contentType = bank
