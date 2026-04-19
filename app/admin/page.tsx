'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getAdminUserByEmail, getAllDepartments } from '@/lib/firebase/firestore'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminHeader } from '@/components/admin/admin-header'

type TabId = 'insights' | 'questions' | 'comments' | 'settings'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("Auth: No user logged in, redirecting to login...");
        router.push('/admin/login');
        return;
      }

      console.log("Auth: User logged in as:", user.email);

      if (!user.email) {
        console.error("Auth: User has no email!");
        setStatus('error');
        return;
      }

      try {
        // Search for user permissions in Firestore
        const adminUser = await getAdminUserByEmail(user.email);
        
        if (!adminUser) {
          console.error("Permissions: Email not found in 'users' collection.");
          setStatus('error');
          return;
        }

        if (!adminUser.role) {
          console.error("Permissions: User found but is missing the 'role' field.");
          setStatus('error');
          return;
        }

        console.log("Permissions: Access granted with role:", adminUser.role);
        setCurrentUser(adminUser);
        
        const allDepts = await getAllDepartments();
        setDepartments(allDepts);

        if (adminUser.departmentId) {
          setSelectedDepartment(adminUser.departmentId);
        } else if (allDepts.length > 0) {
          setSelectedDepartment(allDepts[0].id);
        }

        setStatus('ready');
      } catch (err) {
        console.error("Initialization Error:", err);
        setStatus('error');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-[#2ecfaa] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[#6b6890] font-bold">בודק הרשאות גישה...</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">גישה נדחתה</h1>
        <p className="text-[#6b6890] mb-6">לא נמצאו הרשאות ניהול עבור המייל המחובר.</p>
        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm break-all">
          <p className="font-bold mb-1">המייל איתו התחברת:</p>
          <code>{auth?.currentUser?.email}</code>
        </div>
        <button onClick={() => window.location.reload()} className="bg-[#2a7c7c] text-white px-6 py-2 rounded-lg">נסה שוב</button>
      </div>
    )
  }

  const availableDepartments = currentUser?.role === 'super_admin' 
    ? departments 
    : departments.filter(d => d.id === currentUser?.departmentId)

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      <AdminHeader 
        user={currentUser} 
        title="ממשק מנהלים" 
        onProfileClick={() => setActiveTab('settings')}
      />

      <div className="bg-white px-6 py-3 border-b border-[#e8e7f5] flex items-center gap-4">
        {availableDepartments.length > 1 ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1e1c4a]">בחר מחלקה:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-[#f7f7fc] border border-[#e8e7f5] text-[#1e1c4a] text-sm rounded-lg px-3 py-1.5 focus:border-[#2a7c7c] outline-none"
            >
              {availableDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm font-semibold text-[#1e1c4a]">מחלקה: {availableDepartments[0]?.name || 'כללי'}</div>
        )}
      </div>

      <nav className="bg-white border-b border-[#e8e7f5] px-6 flex gap-1 overflow-x-auto">
        {[
          { id: 'insights', label: 'תובנות', icon: '📊' },
          { id: 'questions', label: 'שאלות', icon: '📋' },
          { id: 'comments', label: 'תגובות', icon: '💬' },
          { id: 'settings', label: 'הגדרות', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`px-5 py-3 text-sm font-semibold border-b-[3px] transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'text-[#2a7c7c] border-[#3d9e9e]' : 'text-[#a8a6c4] border-transparent hover:text-[#6b6890]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
      </main>
    </div>
  )
}
