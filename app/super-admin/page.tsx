'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, getAllDepartments, getAllAdminUsers,
  createDepartment, updateDepartment, deleteDepartment,
  createAdminUser, updateAdminUser, deleteAdminUser,
  copyDefaultQuestionsToDepartment
} from '@/lib/firebase/firestore'
import type { Department, AdminUser } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminHeader } from '@/components/admin/admin-header'

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments')
  
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)

  const [newDeptName, setNewDeptName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'super_admin'>('admin')
  const [newUserDeptId, setNewUserDeptId] = useState('')

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Validate login status and email presence
      if (!user || !user.email) { 
        router.push('/admin/login')
        return 
      }
      
      const adminData = await getAdminUserByEmail(user.email)
      
      // Enforce super_admin role check
      if (adminData?.role !== 'super_admin') { 
        router.push('/admin')
        return 
      }
      
      setCurrentUser(adminData)
      await loadData()
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const loadData = async () => {
    const [depts, users] = await Promise.all([getAllDepartments(), getAllAdminUsers()])
    // Sort departments by name (Hebrew Aleph-Bet)
  const sortedDepts = [...depts].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  
  // Sort users by full name (Hebrew Aleph-Bet)
  const sortedUsers = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, 'he'));
    setDepartments(depts)
    setAdminUsers(users)
  }

  const handleUpdateDept = async () => {
    if (!editDept) return
    await updateDepartment(editDept.id, { name: editDept.name, nameEn: editDept.nameEn })
    setEditDept(null)
    await loadData()
  }

  const handleAddDept = async () => {
    if (!newDeptName) return
    const deptId = await createDepartment({ name: newDeptName, nameEn: '' })
    await copyDefaultQuestionsToDepartment(deptId)
    setNewDeptName('')
    setIsAddDeptOpen(false)
    await loadData()
  }

  const handleUpdateUser = async () => {
    if (!editUser) return
    await updateAdminUser(editUser.id, { fullName: editUser.fullName, role: editUser.role, departmentId: editUser.departmentId })
    setEditUser(null)
    await loadData()
  }

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) return
    const tempId = `user_${Date.now()}`
    await createAdminUser(tempId, {
      email: newUserEmail,
      fullName: newUserName,
      role: newUserRole,
      departmentId: newUserRole === 'admin' ? newUserDeptId : null,
    })
    setNewUserEmail('')
    setNewUserName('')
    setNewUserDeptId('')
    setIsAddUserOpen(false)
    await loadData()
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center" dir="rtl">
      <div className="w-8 h-8 border-4 border-[#2ecfaa] border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-[#6b6890] font-bold">מוודא הרשאות סופר אדמין...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      <AdminHeader user={currentUser} title="סופר אדמין" gradientClass="from-[#1a5c5c] to-[#2a7c7c]" />
      
      <nav className="bg-white border-b border-[#e8e7f5] flex gap-4 px-6">
        <button onClick={() => setActiveTab('departments')} className={`py-4 px-2 border-b-2 ${activeTab === 'departments' ? 'border-[#1a5c5c] text-[#1a5c5c]' : 'border-transparent'}`}>ניהול מחלקות</button>
        <button onClick={() => setActiveTab('users')} className={`py-4 px-2 border-b-2 ${activeTab === 'users' ? 'border-[#1a5c5c] text-[#1a5c5c]' : 'border-transparent'}`}>ניהול משתמשים</button>
      </nav>

      <main className="p-6 max-w-6xl mx-auto space-y-4">
        {activeTab === 'departments' ? (
          <>
            <Button onClick={() => setIsAddDeptOpen(true)} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">+ הוסף מחלקה חדשה</Button>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50"><tr><th className="p-4 font-semibold text-[#6b6890]">שם מחלקה</th><th className="p-4 font-semibold text-[#6b6890]">פעולות</th></tr></thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} className="border-t">
                      <td className="p-4 font-medium text-[#1e1c4a]">{d.name}</td>
                      <td className="p-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditDept(d)}>ערוך</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteDepartment(d.id).then(loadData)}>מחק</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <Button onClick={() => setIsAddUserOpen(true)} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">+ הוסף משתמש חדש</Button>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50"><tr><th className="p-4 font-semibold text-[#6b6890]">שם מלא</th><th className="p-4 font-semibold text-[#6b6890]">אימייל</th><th className="p-4 font-semibold text-[#6b6890]">פעולות</th></tr></thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="p-4 font-medium text-[#1e1c4a]">{u.fullName}</td>
                      <td className="p-4 text-[#6b6890]" dir="ltr">{u.email}</td>
                      <td className="p-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditUser(u)}>ערוך</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteAdminUser(u.id).then(loadData)}>מחק</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Dialogs */}
      <Dialog open={!!editDept} onOpenChange={() => setEditDept(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={editDept?.name || ''} onChange={e => setEditDept(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="שם המחלקה" />
            <Button className="w-full bg-[#2a7c7c]" onClick={handleUpdateDept}>עדכן מחלקה</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={editUser?.fullName || ''} onChange={e => setEditUser(prev => prev ? {...prev, fullName: e.target.value} : null)} placeholder="שם מלא" />
            <Button className="w-full bg-[#2a7c7c]" onClick={handleUpdateUser}>עדכן פרטי משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת מחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="שם המחלקה" />
            <Button className="w-full bg-[#2a7c7c]" onClick={handleAddDept}>צור מחלקה</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="שם מלא" />
            <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="אימייל" dir="ltr" />
            <Select value={newUserRole} onValueChange={(v: 'admin'|'super_admin') => setNewUserRole(v)}>
              <SelectTrigger dir="rtl"><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="admin">מנהל מחלקה</SelectItem>
                <SelectItem value="super_admin">סופר אדמין</SelectItem>
              </SelectContent>
            </Select>
            {newUserRole === 'admin' && (
              <Select value={newUserDeptId} onValueChange={setNewUserDeptId}>
                <SelectTrigger dir="rtl"><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                <SelectContent dir="rtl">
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button className="w-full bg-[#2a7c7c]" onClick={handleAddUser}>צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
