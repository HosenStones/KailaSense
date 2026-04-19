'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getAdminUser, getAllDepartments } from '@/lib/firebase/firestore'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminHeader } from '@/components/admin/admin-header'

type TabId = 'insights' | 'questions' | 'comments' | 'settings'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login')
        return
      }

      // Fetch user from 'users' collection
      const adminUser = await getAdminUser(user.uid)
      setCurrentUser(adminUser)

      // Initial data fetch
      const allDepts = await getAllDepartments()
      setDepartments(allDepts)

      if (adminUser?.departmentId) {
        setSelectedDepartment(adminUser.departmentId)
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id)
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center" dir="rtl">
        <div className="text-[#6b6890] font-medium">טוען את ממשק הניהול...</div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'insights', label: 'תובנות', icon: '📊' },
    { id: 'questions', label: 'שאלות', icon: '📋' },
    { id: 'comments', label: 'תגובות', icon: '💬' },
    { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  ]

  const availableDepartments = currentUser?.role === 'super_admin' 
    ? departments 
    : departments.filter(d => d.id === currentUser?.departmentId)

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      {/* Header with profile navigation logic */}
      <AdminHeader 
        user={currentUser} 
        title="ממשק מנהלים" 
        onProfileClick={() => setActiveTab('settings')}
      />

      {/* Department Selector */}
      <div className="bg-white px-6 py-3 border-b border-[#e8e7f5] flex items-center gap-4">
        {availableDepartments.length > 1 ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1e1c4a]">בחר מחלקה לצפייה:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-[#f7f7fc] border border-[#e8e7f5] text-[#1e1c4a] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#2a7c7c]"
            >
              {availableDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm font-semibold text-[#1e1c4a]">
            מציג נתונים עבור: {availableDepartments[0]?.name || 'מחלקה כללית'}
          </div>
        )}
      </div>

      {/* Tabs */}
      <nav className="bg-white border-b border-[#e8e7f5] px-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-[3px] transition-colors ${
              activeTab === tab.id
                ? 'text-[#2a7c7c] border-[#3d9e9e]'
                : 'text-[#a8a6c4] border-transparent hover:text-[#6b6890]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content Area */}
      <main className="p-6 max-w-6xl mx-auto">
        {!selectedDepartment ? (
          <div className="text-center p-12 text-[#a8a6c4]">אנא בחרי מחלקה כדי לצפות בנתונים</div>
        ) : (
          <>
            {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
            {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
            {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
            {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
          </>
        )}
      </main>
    </div>
  )
}
