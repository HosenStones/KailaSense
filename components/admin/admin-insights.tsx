'use client'

import { useState, useEffect } from 'react'
import { getDepartmentStats } from '@/lib/firebase/firestore'

export function AdminInsights({ departmentId }: { departmentId: string }) {
  const [stats, setStats] = useState({ totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRealStats() {
      if (!departmentId) return
      setLoading(true)
      const data = await getDepartmentStats(departmentId)
      setStats(data)
      setLoading(false)
    }
    fetchRealStats()
  }, [departmentId]) // קריטי: המעקב אחרי ה-ID

// Inside app/admin/page.tsx - update the loading state
if (status === 'loading') {
  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center" dir="rtl">
      <div className="w-8 h-8 border-4 border-[#2ecfaa] border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-[#6b6890] font-bold">טוען תובנות...</div>
    </div>
  )
}

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e7f5] text-center">
        <div className="text-3xl font-bold text-[#2ecfaa]">{stats.totalResponses}</div>
        <div className="text-xs text-[#a8a6c4] mt-1 uppercase">משיבים</div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e7f5] text-center">
        <div className="text-3xl font-bold text-[#2a7c7c]">{stats.satisfactionPercentage}%</div>
        <div className="text-xs text-[#a8a6c4] mt-1 uppercase">שביעות רצון</div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e7f5] text-center">
        <div className="text-3xl font-bold text-[#3d3a9e]">{stats.totalComments}</div>
        <div className="text-xs text-[#a8a6c4] mt-1 uppercase">תגובות</div>
      </div>
    </div>
  )
}
