'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllDepartments, updateDepartment } from '@/lib/firebase/firestore'
import type { Department } from '@/lib/types'

export function AdminSettings({ departmentId }: { departmentId: string }) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDept() {
      setIsLoading(true)
      const all = await getAllDepartments()
      const current = all.find(d => d.id === departmentId)
      if (current) {
        setDepartment(current)
        setName(current.name)
      }
      setIsLoading(false)
    }
    if (departmentId) loadDept()
  }, [departmentId])

  const handleSave = async () => {
    if (!department) return
    setIsSaving(true)
    try {
      await updateDepartment(department.id, { name })
      setMessage('ההגדרות נשמרו בהצלחה')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('שגיאה בשמירת הנתונים')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-4 text-center text-[#6b6890]">טוען הגדרות מחלקה...</div>

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-[#e8e7f5] p-6 space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-bold text-[#1e1c4a] mb-4">הגדרות מחלקה</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b6890] mb-1">שם המחלקה (עברית)</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="לדוגמה: קרדיולוגיה"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#e8e7f5] flex items-center justify-between">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#2ecfaa] hover:bg-[#26b091] text-white px-8"
        >
          {isSaving ? 'שומר...' : 'שמור שינויים'}
        </Button>
        {message && <span className="text-sm font-medium text-[#2a7c7c]">{message}</span>}
      </div>
    </div>
  )
}
