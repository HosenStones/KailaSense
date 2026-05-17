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

  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  
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

  const getRoleWeight = (role: string) => {
    if (role === 'super_admin') return 1;
    if (role === 'admin') return 2;
    return 3;
  };

  const sortedUsers = [...adminUsers].sort((a, b) => {
    if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
    if (a.role !== 'super_admin' && b.role === 'super_admin') return 1;
    const deptA = departments.find(d => d.id === a.departmentId)?.name || '';
    const deptB = departments.find(d => d.id === b.departmentId)?.name || '';
    const deptComp = deptA.localeCompare(deptB, 'he');
    if (deptComp !== 0) return deptComp;
    const roleComp = getRoleWeight(a.role) - getRoleWeight(b.role);
    if (roleComp !== 0) return roleComp;
    return a.fullName.localeCompare(b.fullName, 'he');
  });

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center font-bold text-primary">טוען נתונים...</div>

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab(currentUser?.role === 'super_admin' ? 'system' : 'settings')} />

      <div className="bg-card/90 backdrop-blur-md border-b border-border px-6 flex justify-between items-center h-14">
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
              className={`px-5 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-card-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {currentUser?.role === 'super_admin' && (
          <div className={`flex items-center gap-3 transition-opacity ${activeTab === 'system' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span className="text-sm font-bold text-card-foreground">מחלקה:</span>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 h-9 text-right bg-background border-border text-foreground cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-popover-foreground cursor-pointer">{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6 min-h-[500px]">
          {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
          {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
          {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
          {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
          
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-4">
                <Button onClick={() => setIsAddDeptOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer">+ מחלקה חדשה</Button>
                <Button onClick={() => setIsAddUserOpen(true)} variant="outline" className="border-border bg-card text-foreground hover:bg-secondary font-bold cursor-pointer"> + איש צוות חדש</Button>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-card-foreground">
                <h2 className="font-bold text-card-foreground mb-4 text-lg border-b border-border pb-2">מחלקות המרכז הרפואי</h2>
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="text-muted-foreground text-sm border-b border-border"><th className="pb-3 font-semibold">שם מחלקה</th><th className="pb-3 w-32 font-semibold">פעולות</th></tr>
                  </thead>
                  <tbody>
                    {departments.map(d => (
                      <tr key={d.id} className="border-b border-secondary last:border-0 hover:bg-secondary/80 transition-colors">
                        <td className="py-3.5 font-medium text-card-foreground">{d.name}</td>
                        <td className="py-3.5 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditDept(d)} className="border-border text-card-foreground hover:bg-secondary cursor-pointer">ערוך</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => deleteDepartment(d.id).then(() => loadData(currentUser!.email))}>מחק</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-card-foreground">
                <h2 className="font-bold text-card-foreground mb-4 text-lg border-b border-border pb-2">אנשי צוות וניהול מערכת</h2>
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="text-muted-foreground text-sm border-b border-border">
                      <th className="pb-3 font-semibold">שם מלא</th>
                      <th className="pb-3 font-semibold">שיוך מחלקתי</th>
                      <th className="pb-3 font-semibold">הרשאת גישה</th>
                      <th className="pb-3 w-32 font-semibold">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(u => (
                      <tr key={u.id} className="border-b border-secondary last:border-0 hover:bg-secondary/80 transition-colors">
                        <td className="py-3.5 font-semibold text-card-foreground">{u.fullName}</td>
                        <td className="py-3.5 text-muted-foreground">{u.role === 'super_admin' ? 'כל המרכז הרפואי' : departments.find(d => d.id === u.departmentId)?.name || 'ללא שיוך'}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.role === 'super_admin' ? 'bg-primary text-primary-foreground' : u.role === 'admin' ? 'bg-accent text-accent-foreground border border-primary/20' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {u.role === 'super_admin' ? 'סופר אדמין' : u.role === 'admin' ? 'מנהל' : 'צוות'}
                          </span>
                        </td>
                        <td className="py-3.5 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditUser(u)} className="border-border text-card-foreground hover:bg-secondary cursor-pointer">ערוך</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => deleteAdminUser(u.id).then(() => loadData(currentUser!.email))}>מחק</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent dir="rtl" className="bg-card border-border text-card-foreground">
          <DialogHeader><DialogTitle className="text-card-foreground">עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input className="bg-input text-card-foreground border-border" value={editDept?.name || ''} onChange={e => setEditDept(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="שם המחלקה" />
            <Button onClick={handleUpdateDept} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">שמור שינויים</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent dir="rtl" className="bg-card border-border text-card-foreground">
          <DialogHeader><DialogTitle className="text-card-foreground">עריכת פרטי משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">שם מלא</label>
              <Input className="bg-input text-card-foreground border-border" value={editUser?.fullName || ''} onChange={e => setEditUser(prev => prev ? {...prev, fullName: e.target.value} : null)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">אימייל (לצורך זיהוי בלבד)</label>
              <Input className="bg-input text-card-foreground border-border" value={editUser?.email || ''} onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : null)} dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">תפקיד</label>
              <Select value={editUser?.role || ''} onValueChange={r => setEditUser(prev => prev ? {...prev, role: r as any} : null)}>
                <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl" className="bg-popover border-border">
                  <SelectItem value="staff" className="text-popover-foreground cursor-pointer">איש צוות (צפייה בלבד)</SelectItem>
                  <SelectItem value="admin" className="text-popover-foreground cursor-pointer">מנהל מחלקה</SelectItem>
                  <SelectItem value="super_admin" className="text-popover-foreground cursor-pointer">סופר אדמין</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editUser?.role !== 'super_admin' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">שיוך למחלקה</label>
                <Select value={editUser?.departmentId || ''} onValueChange={d => setEditUser(prev => prev ? {...prev, departmentId: d} : null)}>
                  <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent dir="rtl" className="bg-popover border-border">
                    {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-popover-foreground cursor-pointer">{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleUpdateUser} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">שמור שינויים</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent dir="rtl" className="bg-card border-border text-card-foreground">
          <DialogHeader><DialogTitle className="text-card-foreground">הוספת מחלקה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input className="bg-input text-card-foreground border-border" placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
            <Button onClick={handleAddDept} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">צור מחלקה</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl" className="bg-card border-border text-card-foreground">
          <DialogHeader><DialogTitle className="text-card-foreground">הוספת איש צוות חדש</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input className="bg-input text-card-foreground border-border" placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
            <Input className="bg-input text-card-foreground border-border" placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" />
            <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r as any})}>
              <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                <SelectItem value="staff" className="text-popover-foreground cursor-pointer">איש צוות (צפייה בלבד)</SelectItem>
                <SelectItem value="admin" className="text-popover-foreground cursor-pointer">מנהל מחלקה</SelectItem>
                <SelectItem value="super_admin" className="text-popover-foreground cursor-pointer">סופר אדמין</SelectItem>
              </SelectContent>
            </Select>
            {newUser.role !== 'super_admin' && (
              <Select value={newUser.deptId} onValueChange={d => setNewUser({...newUser, deptId: d})}>
                <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                <SelectContent dir="rtl" className="bg-popover border-border">
                  {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-popover-foreground cursor-pointer">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleAddUser} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
