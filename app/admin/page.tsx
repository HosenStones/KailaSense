'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, 
  getAllDepartments, 
  getAllAdminUsersSorted,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  copyDefaultQuestionsToDepartment
} from '@/lib/firebase/firestore'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminHeader } from '@/components/admin/admin-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TabId = 'insights' | 'questions' | 'comments' | 'settings' | 'system'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // System Management States
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' as any, deptId: '' })

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { setStatus('error'); return; }
      setCurrentUser(adminData);

      const allDepts = await getAllDepartments();
      setDepartments(allDepts);

      if (adminData.role === 'super_admin') {
        const allUsers = await getAllAdminUsersSorted(allDepts);
        setAdminUsers(allUsers);
      }

      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id);
      }
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/admin/login'); return; }
      if (user.email) loadData(user.email);
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddDept = async () => {
    if (!newDeptName) return;
    const id = await createDepartment({ name: newDeptName });
    await copyDefaultQuestionsToDepartment(id);
    setNewDeptName(''); setIsAddDeptOpen(false);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    await createAdminUser(`user_${Date.now()}`, {
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      departmentId: newUser.role === 'super_admin' ? null : newUser.deptId
    });
    setNewUser({ email: '', fullName: '', role: 'staff', deptId: '' });
    setIsAddUserOpen(false);
    if (currentUser?.email) loadData(currentUser.email);
  }

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">טוען...</div>

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab('settings')} />

      {/* Department Selector (Only for Super Admins) */}
      {currentUser?.role === 'super_admin' && activeTab !== 'system' && (
        <div className="bg-white px-6 py-3 border-b flex items-center gap-4">
          <span className="text-sm font-bold">צפייה במחלקה:</span>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {[
          { id: 'insights', label: 'תובנות', icon: '📊' },
          { id: 'comments', label: 'תגובות', icon: '💬' },
          ...(currentUser?.role !== 'staff' ? [
            { id: 'questions', label: 'שאלות', icon: '📋' },
            { id: 'settings', label: 'הגדרות', icon: '⚙️' }
          ] : []),
          ...(currentUser?.role === 'super_admin' ? [{ id: 'system', label: 'ניהול מערכת', icon: '🛡️' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`px-5 py-3 text-sm font-semibold border-b-[3px] transition-colors ${
              activeTab === tab.id ? 'text-[#2a7c7c] border-[#2a7c7c]' : 'text-[#a8a6c4] border-transparent'
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
        
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button onClick={() => setIsAddDeptOpen(true)} className="bg-[#2a7c7c]">+ מחלקה חדשה</Button>
              <Button onClick={() => setIsAddUserOpen(true)} variant="outline"> + איש צוות חדש</Button>
            </div>

            {/* Departments Table */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="font-bold mb-4">מחלקות במערכת</h2>
              <table className="w-full text-right">
                <thead><tr className="text-gray-400 text-sm border-b"><th className="pb-2">שם</th><th className="pb-2">פעולות</th></tr></thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} className="border-b last:border-0"><td className="py-3">{d.name}</td><td>
                      <Button variant="ghost" size="sm" onClick={() => deleteDepartment(d.id).then(() => loadData(currentUser!.email))}>מחק</Button>
                    </td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="font-bold mb-4">אנשי צוות וניהול</h2>
              <table className="w-full text-right">
                <thead><tr className="text-gray-400 text-sm border-b"><th className="pb-2">שם</th><th className="pb-2">מחלקה</th><th className="pb-2">תפקיד</th></tr></thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{u.fullName}</td>
                      <td>{departments.find(d => d.id === u.departmentId)?.name || 'כל המערכת'}</td>
                      <td className="text-sm text-gray-500">{u.role === 'super_admin' ? 'סופר אדמין' : u.role === 'admin' ? 'מנהל' : 'צוות'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs for adding data */}
      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת מחלקה</DialogTitle></DialogHeader>
          <Input placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="mt-4" />
          <Button onClick={handleAddDept} className="bg-[#2a7c7c] w-full">צור מחלקה</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת איש צוות</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
            <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" />
            <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="staff">איש צוות (צפייה בלבד)</SelectItem>
                <SelectItem value="admin">מנהל מחלקה</SelectItem>
                <SelectItem value="super_admin">סופר אדמין</SelectItem>
              </SelectContent>
            </Select>
            {newUser.role !== 'super_admin' && (
              <Select value={newUser.deptId} onValueChange={d => setNewUser({...newUser, deptId: d})}>
                <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                <SelectContent dir="rtl">
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleAddUser} className="bg-[#2a7c7c] w-full">צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
