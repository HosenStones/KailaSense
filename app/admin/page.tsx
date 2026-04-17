'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { signOut } from '@/lib/firebase/auth-context'
import { Button } from '@/components/ui/button'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'

type TabId = 'insights' | 'questions' | 'comments' | 'settings'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('cardiology-sheba')

  useEffect(() => {
    if (!auth) {
      router.push('/admin/login')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login')
      } else {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center">
        <div className="text-[#6b6890]">טוען...</div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'insights', label: 'תובנות', icon: '📊' },
    { id: 'questions', label: 'שאלות', icon: '❓' },
    { id: 'comments', label: 'תגובות', icon: '💬' },
    { id: 'settings', label: 'הגדרות', icon: '⚙️' },
  ]

  const departments = [
    { id: 'cardiology-sheba', name: 'קרדיולוגיה - שיבא' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f7fc]">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-[#2a7c7c] to-[#3d9e9e] h-14 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <Image
              src="/images/kaila-logo-horizontal.png"
              alt="Kaila"
              width={100}
              height={30}
              className="h-6 w-auto"
            />
          </div>
          <span className="text-white/70 text-sm border-r border-white/20 pr-4">דשבורד ניהולי</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-white/15 border border-white/25 text-white text-sm rounded-lg px-3 py-1.5 focus:border-[#7dd3d3] outline-none"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id} className="bg-[#2a7c7c] text-white">
                {dept.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 bg-[#7dd3d3] rounded-full flex items-center justify-center text-xs font-bold text-[#1e4a40]">
              א
            </div>
            <span className="text-white text-sm font-semibold">אדמין</span>
          </div>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-white/80 hover:text-white hover:bg-white/15 text-sm border border-white/25 rounded-lg px-3 py-1.5 h-auto"
          >
            יציאה
          </Button>
        </div>
      </header>

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

      {/* Content */}
      <main className="p-6">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
      </main>
    </div>
  )
}
