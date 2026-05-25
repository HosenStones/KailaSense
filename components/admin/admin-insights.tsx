'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart2, Calendar } from 'lucide-react'

export function AdminInsights({ departmentId }: { departmentId: string }) {
  const [timeFilter, setTimeFilter] = useState('30d')

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4"/> תובנות</h3>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="h-8 text-xs w-40 bg-white"><Calendar className="w-3.5 h-3.5 mr-1 ml-2"/><SelectValue placeholder="סנן לפי זמן" /></SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="24h" className="text-xs">24 שעות אחרונות</SelectItem>
            <SelectItem value="7d" className="text-xs">7 ימים אחרונים</SelectItem>
            <SelectItem value="30d" className="text-xs">30 ימים אחרונים</SelectItem>
            <SelectItem value="1y" className="text-xs">שנה אחרונה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* קוביות תובנות ריקות בינתיים... */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center h-32">
          <span className="text-3xl font-bold text-primary">85%</span>
          <span className="text-xs text-slate-500 mt-1">שביעות רצון כללית</span>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center h-32">
          <span className="text-3xl font-bold text-emerald-500">120</span>
          <span className="text-xs text-slate-500 mt-1">מטופלים פעילים</span>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center h-32">
          <span className="text-3xl font-bold text-blue-500">45</span>
          <span className="text-xs text-slate-500 mt-1">תגובות חדשות</span>
        </div>
      </div>
      
    </div>
  )
}
