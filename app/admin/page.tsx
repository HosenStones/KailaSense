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

  // Management Modal States
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  
  const [newDeptName, setNewDeptName] = useState('')
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' as any, deptId: '' })

  // Data fetching logic
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

      // Default department selection
      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id);
      }
      setStatus('ready');
    } catch (err) {
      console.error("Error loading dashboard data:", err);
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

  // Handler Actions
  const handleAddDept = async () => {
    if (!newDeptName) return;
    const id = await createDepartment({ name: newDeptName });
    await copyDefaultQuestionsToDepartment(id);
    setNewDeptName(''); setIsAddDeptOpen(false);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleUpdateDept = async () => {
    if (!editDept) return;
    await updateDepartment(editDept.id, { name: editDept.name });
    setEditDept(null);
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

  const handleUpdateUser = async () => {
    if (!editUser) return;
    await updateAdminUser(editUser.id, {
      fullName: editUser.fullName,
      email: editUser.email,
      role: editUser.role,
      departmentId: editUser.role === 'super_admin' ? null : editUser.departmentId
    });
    setEditUser(null);
    if (currentUser?.email) loadData(currentUser.email);
  }

  // Hierarchical Sorting logic
  const getRoleWeight = (role: string) => {
    if (role === 'super_admin') return 1;
    if (role === 'admin') return 2;
    return 3;
  };

  const sortedUsers = [...adminUsers].sort((a, b) => {
    // 1. Super Admins first
    if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
    if (a.role !== 'super_admin' && b.role === 'super_admin') return 1;

    // 2. By Department Name (Hebrew)
    const deptA = departments.find(d => d.id === a.departmentId)?.name || '';
    const deptB = departments.find(d => d.id === b.departmentId)?.name || '';
    const deptComp = deptA.localeCompare(deptB, 'he');
    if (deptComp !== 0) return deptComp;

    // 3. By Role within department
    const roleComp = getRoleWeight(a.role) - getRoleWeight(b.role);
    if (roleComp !== 0) return roleComp;

    // 4. By Full Name
    return a.fullName.localeCompare(b.fullName, 'he');
  });

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center font-bold text-[#2a7c7c]">טוען נתונים...</div>

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      <AdminHeader 
        user={currentUser} 
        title="ממשק ניהול" 
        onProfileClick={() => setActiveTab(currentUser?.role === 'super_admin' ? 'system' : 'settings')} 
      />

      {/* Persistent Nav Bar with Left-aligned Dept Selector */}
      <div className="bg-white border-b px-6 flex justify-between items-center h-14">
        <nav className="flex gap-1 h-full">
          {[
            { id: 'insights', label: 'תובנות', icon: '📊' },
            { id: 'comments', label: 'תגובות', icon: '💬' },
            ...(currentUser?.role !== 'staff' ? [
              { id: 'questions', label: 'שאלות', icon: '📋' },
              { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' }
            ] : []),
            ...(currentUser?.role === 'super_admin' ? [{ id: 'system', label: 'ניהול מערכת', icon: '🛡️' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-5 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'text-[#2a7c7c] border-[#2a7c7c]' : 'text-[#a8a6c4] border-transparent hover:text-[#6b6890]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Dept Selector aligned to the left of the screen (end of flex) */}
        {currentUser?.role === 'super_admin' && (
          <div className={`flex items-center gap-3 transition-opacity ${activeTab === 'system' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="text-sm font-bold text-[#1e1c4a]">מחלקה:</span>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 h-9 text-right bg-[#f7f7fc] border-[#e8e7f5]"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button onClick={() => setIsAddDeptOpen(true)} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">+ מחלקה חדשה</Button>
              <Button onClick={() => setIsAddUserOpen(true)} variant="outline"> + איש צוות חדש</Button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="font-bold text-[#1e1c4a] mb-4 text-lg">מחלקות</h2>
              <table className="w-full text-right">
                <thead><tr className="text-[#a8a6c4] text-sm border-b"><th className="pb-2">שם מחלקה</th><th className="pb-2 w-32">פעולות</th></tr></thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{d.name}</td>
                      <td className="py-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditDept(d)}>ערוך</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDepartment(d.id).then(() => loadData(currentUser!.email))}>מחק</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="font-bold text-[#1e1c4a] mb-4 text-lg">אנשי צוות וניהול</h2>
              <table className="w-full text-right">
                <thead><tr className="text-[#a8a6c4] text-sm border-b"><th className="pb-2">שם מלא</th><th className="pb-2">מחלקה</th><th className="pb-2">תפקיד</th><th className="pb-2 w-32">פעולות</th></tr></thead>
                <tbody>
                  {sortedUsers.map(u => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-[#1e1c4a]">{u.fullName}</td>
                      <td className="py-3 text-[#6b6890]">{u.role === 'super_admin' ? 'כל המערכת' : departments.find(d => d.id === u.departmentId)?.name || 'ללא שיוך'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'super_admin' ? 'bg-[#1a5c5c] text-white' : u.role === 'admin' ? 'bg-[#7dd3d3] text-[#1a5c5c]' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'super_admin' ? 'סופר אדמין' : u.role === 'admin' ? 'מנהל' : 'צוות'}
                      </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditUser(u)}>ערוך</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteAdminUser(u.id).then(() => loadData(currentUser!.email))}>מחק</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- Management Dialogs --- */}
      
      {/* Edit Department */}
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input value={editDept?.name || ''} onChange={e => setEditDept(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="שם המחלקה" />
            <Button onClick={handleUpdateDept} className="w-full bg-[#2a7c7c] text-white">שמור שינויים</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User (including Email) */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת פרטי משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">שם מלא</label>
              <Input value={editUser?.fullName || ''} onChange={e => setEditUser(prev => prev ? {...prev, fullName: e.target.value} : null)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">אימייל (לצורך זיהוי בלבד)</label>
              <Input value={editUser?.email || ''} onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : null)} dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">תפקיד</label>
              <Select value={editUser?.role || ''} onValueChange={r => setEditUser(prev => prev ? {...prev, role: r as any} : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="staff">איש צוות (צפייה בלבד)</SelectItem>
                  <SelectItem value="admin">מנהל מחלקה</SelectItem>
                  <SelectItem value="super_admin">סופר אדמין</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editUser?.role !== 'super_admin' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">שיוך למחלקה</label>
                <Select value={editUser?.departmentId || ''} onValueChange={d => setEditUser(prev => prev ? {...prev, departmentId: d} : null)}>
                  <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleUpdateUser} className="w-full bg-[#2a7c7c] text-white">שמור שינויים</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dept */}
      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת מחלקה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
            <Button onClick={handleAddDept} className="w-full bg-[#2a7c7c] text-white">צור מחלקה</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת איש צוות חדש</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
            <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" />
            <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r as any})}>
              <SelectTrigger><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
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
            <Button onClick={handleAddUser} className="w-full bg-[#2a7c7c] text-white">צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
