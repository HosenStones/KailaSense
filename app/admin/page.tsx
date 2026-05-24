'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, 
  getAllDepartments, 
  getGlobalQuestions
} from '@/lib/firebase/firestore'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminScheduling } from '@/components/admin/admin-scheduling'
import { AdminHeader } from '@/components/admin/admin-header'

type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { 
        setStatus('error'); 
        return; 
      }
      setCurrentUser(adminData);
      const allDepts = await getAllDepartments();
      setDepartments(allDepts);
      
      // Load super admin tools if permission matches
      if (adminData.role === 'super_admin') {
        const bankData = await getGlobalQuestions();
        setGlobalBank(bankData);
      }
      
      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id);
      }
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { 
        router.push('/admin/login'); 
        return; 
      }
      if (user.email) loadData(user.email);
    });
    return () => unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        טוען את נתוני המערכת...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-destructive">
        שגיאה בטעינת הנתונים. ודא כי המשתמש קיים ומורשה לגשת לממשק הניהול.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="לוח בקרה ומעקב" onProfileClick={() => setActiveTab('settings')} />
      
      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar w-full md:w-auto">
          {[
            { id: 'insights', label: 'תובנות ומדדים', icon: '📊' },
            { id: 'comments', label: 'תגובות והערות', icon: '💬' },
            { id: 'questions', label: 'ניהול שאלונים', icon: '📋' },
            { id: 'scheduling', label: 'בקרה ומעקב מטופלים', icon: '⏱️' },
            { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' },
            ...(currentUser?.role === 'super_admin' ? [
              { id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, 
              { id: 'bank', label: 'בנק שאלות גלובלי', icon: '📚' }
            ] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        {activeTab === 'system' && (
          <div className="p-6 bg-white border border-border rounded-2xl text-sm text-slate-600 shadow-sm">
            ממשק ניהול מערכת מורחב עבור מנהלי על.
          </div>
        )}
        {activeTab === 'bank' && (
          <div className="p-6 bg-white border border-border rounded-2xl text-sm text-slate-600 shadow-sm">
            ניהול ועריכת מאגר השאלות המרכזי של כלל מחלקות בית החולים.
          </div>
        )}
      </main>
    </div>
  )
}
