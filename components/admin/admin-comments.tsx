'use client'

import { useState, useEffect } from 'react'
import { getResponsesByDepartment } from '@/lib/firebase/firestore'
import type { Response } from '@/lib/types'
import { MessageSquare, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AdminComments({ departmentId }: { departmentId: string }) {
  const [comments, setComments] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('30d')

  useEffect(() => {
    async function loadComments() {
      if (!departmentId) return;
      setLoading(true);
      try {
        const allResponses = await getResponsesByDepartment(departmentId)
        setComments(allResponses.filter(r => r.answerText && r.answerText.trim().length > 0))
      } catch (e) {
        console.error("Failed to load comments", e)
      } finally {
        setLoading(false)
      }
    }
    loadComments()
  }, [departmentId])

  const filteredComments = comments.filter(c => {
    if (!c.createdAt) return true;
    const cDate = new Date(c.createdAt).getTime();
    const now = new Date().getTime();
    const diff = now - cDate;
    if (timeFilter === '24h') return diff <= 24 * 60 * 60 * 1000;
    if (timeFilter === '7d') return diff <= 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === '30d') return diff <= 30 * 24 * 60 * 60 * 1000;
    if (timeFilter === '1y') return diff <= 365 * 24 * 60 * 60 * 1000;
    return true;
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm" dir="rtl">
      
      {/* Time Filter and Title */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#2a7c7c]" /> תגובות אחרונות
        </h3>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48 bg-white border-[#e8e7f5] text-right" dir="rtl">
            <div className="flex items-center gap-2 w-full">
              <Calendar className="w-4 h-4 text-[#2a7c7c]" />
              <SelectValue placeholder="סנן לפי זמן" />
            </div>
          </SelectTrigger>
          <SelectContent dir="rtl" className="text-right">
            <SelectItem value="24h" className="justify-start">24 שעות אחרונות</SelectItem>
            <SelectItem value="7d" className="justify-start">7 ימים אחרונים</SelectItem>
            <SelectItem value="30d" className="justify-start">30 ימים אחרונים</SelectItem>
            <SelectItem value="1y" className="justify-start">שנה אחרונה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#2a7c7c]">טוען תגובות...</div>
      ) : filteredComments.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed">
          אין תגובות להצגה בטווח הזמן שנבחר.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComments.map(comment => {
            const date = new Date(comment.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={comment.id} className="bg-[#f7f7fc] p-5 rounded-xl border border-[#e8e7f5] relative flex flex-col justify-between min-h-[140px]">
                <div className="text-[#2a7c7c] opacity-20 text-4xl absolute top-2 right-4">"</div>
                <p className="text-[#1e1c4a] font-medium text-sm leading-relaxed relative z-10 mt-2 mb-4">
                  {comment.answerText}
                </p>
                <div className="text-xs text-[#a8a6c4] border-t border-[#e8e7f5] pt-3">
                  התקבל ב- {date}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
