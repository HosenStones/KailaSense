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
        // מסננים רק תגובות עם טקסט
        setComments(allResponses.filter(r => r.answerText && r.answerText.trim().length > 0))
      } catch (e) {
        console.error("Failed to load comments", e)
      } finally {
        setLoading(false)
      }
    }
    loadComments()
  }, [departmentId])

  // Filter comments based on the selected time range
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
    <div className="space-y-6" dir="rtl">
      {/* Header and Filter Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-800" /> תגובות
        </h3>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="h-8 text-xs w-40 bg-white">
            <Calendar className="w-3.5 h-3.5 mr-1 ml-2" />
            <SelectValue placeholder="סנן לפי זמן" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="24h" className="text-xs">24 שעות אחרונות</SelectItem>
            <SelectItem value="7d" className="text-xs">7 ימים אחרונים</SelectItem>
            <SelectItem value="30d" className="text-xs">30 ימים אחרונים</SelectItem>
            <SelectItem value="1y" className="text-xs">שנה אחרונה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comments Grid */}
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">טוען תגובות...</div>
      ) : filteredComments.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-xl border border-dashed">
          אין תגובות להצגה בטווח הזמן שנבחר.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComments.map(comment => {
            const date = new Date(comment.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={comment.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                <p className="text-slate-800 text-sm leading-relaxed mb-4">
                  {comment.answerText}
                </p>
                <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
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
