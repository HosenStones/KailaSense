'use client'

import { useState, useEffect } from 'react'
import { getDepartmentStats, getResponsesByDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'
import { Button } from '@/components/ui/button'

export function AdminInsights({ departmentId }: { departmentId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true)
      const data = await getDepartmentStats(departmentId)
      setStats(data)
      setIsLoading(false)
    }
    if (departmentId) loadStats()
  }, [departmentId])

  const exportToExcel = async () => {
    try {
      const responses = await getResponsesByDepartment(departmentId)
      const questions = await getQuestionsByDepartment(departmentId)

      // בניית הכותרות והנתונים
      const headers = ['תאריך', 'שאלה', 'תשובה (ערך)', 'תשובה (טקסט)'].join(',')
      const rows = responses.map(r => {
        const q = questions.find(question => question.id === r.questionId)
        return [
          new Date(r.createdAt).toLocaleDateString('he-IL'),
          `"${q?.questionText || 'שאלה נמחקה'}"`,
          r.answerValue || '',
          `"${r.answerText || ''}"`
        ].join(',')
      })

      const csvContent = "\uFEFF" + headers + "\n" + rows.join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      link.setAttribute("href", url)
      link.setAttribute("download", `KailaSense_Export_${departmentId}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      alert("שגיאה בייצוא הנתונים")
    }
  }

  if (isLoading) return <div className="text-center p-8 text-[#a8a6c4]">מעבד נתונים...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1e1c4a]">תובנות מחלקתיות</h2>
        <Button onClick={exportToExcel} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
          📥 ייצוא נתונים לאקסל
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] text-center">
          <div className="text-3xl font-bold text-[#2ecfaa]">{stats?.totalResponses || 0}</div>
          <div className="text-sm text-[#6b6890]">סקרים שהושלמו</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] text-center">
          <div className="text-3xl font-bold text-[#2a7c7c]">{stats?.satisfactionPercentage || 0}%</div>
          <div className="text-sm text-[#6b6890]">שביעות רצון ממוצעת</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] text-center">
          <div className="text-3xl font-bold text-[#3d3a9e]">{stats?.totalComments || 0}</div>
          <div className="text-sm text-[#6b6890]">תגובות כתובות</div>
        </div>
      </div>

      <div className="bg-[#e4faf5] p-4 rounded-xl border border-[#2ecfaa] text-[#1e4a40] text-sm italic">
        * הנתונים מבוססים על תשובות אמת שנשמרו ב-Firebase. שביעות הרצון מחושבת לפי דירוגי 4-5.
      </div>
    </div>
  )
}
