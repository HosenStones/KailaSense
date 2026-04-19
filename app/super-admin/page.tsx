'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUser, getAllDepartments, getAllAdminUsers,
  createDepartment, updateDepartment, deleteDepartment,
  createAdminUser, updateAdminUser, deleteAdminUser
} from '@/lib/firebase/firestore'
import type { Department, AdminUser } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AdminHeader } from '@/components/admin/admin-header'

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments')
  
  // Edit states
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/admin/login'); return }
      const adminData = await getAdminUser(user.uid)
      if (adminData?.role !== 'super_admin') { router.push('/admin'); return }
      setCurrentUser(adminData)
      await loadData()
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const loadData = async () => {
    const [depts, users] = await Promise.all([getAllDepartments(), getAllAdminUsers()])
    setDepartments(depts)
    setAdminUsers(users)
  }

  const handleUpdateDept = async () => {
    if (!editDept) return
    await updateDepartment(editDept.id, { name: editDept.name, nameEn: editDept.nameEn })
    setEditDept(null)
    await loadData()
  }

  const handleUpdateUser = async () => {
    if (!editUser) return
    await updateAdminUser(editUser.id, { fullName: editUser.fullName, role: editUser.role, departmentId: editUser.departmentId })
    setEditUser(null)
    await loadData()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      {/* Shared Header Component */}
      <AdminHeader user={currentUser} title="סופר אדמין" gradientClass="from-[#1a5c5c] to-[#2a7c7c]" />
      
      {/* Tabs Navigation */}
      <nav className="bg-white border-b border-[#e8e7f5] flex gap-4 px-6">
        <button onClick={() => setActiveTab('departments')} className={`py-4 px-2 border-b-2 ${activeTab === 'departments' ? 'border-[#1a5c5c] text-[#1a5c5c]' : 'border-transparent'}`}>מחלקות</button>
        <button onClick={() => setActiveTab('users')} className={`py-4 px-2 border-b-2 ${activeTab === 'users' ? 'border-[#1a5c5c] text-[#1a5c5c]' : 'border-transparent'}`}>משתמשים</button>
      </nav>

      {/* Render Active Tab Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'departments' ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-gray-50">
                <tr><th className="p-4">שם מחלקה</th><th className="p-4">פעולות</th></tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="p-4">{d.name}</td>
                    <td className="p-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditDept(d)}>ערוך</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteDepartment(d.id).then(loadData)}>מחק</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-gray-50">
                <tr><th className="p-4">שם מלא</th><th className="p-4">אימייל</th><th className="p-4">פעולות</th></tr>
              </thead>
              <tbody>
                {adminUsers.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-4">{u.fullName}</td>
                    <td className="p-4" dir="ltr">{u.email}</td>
                    <td className="p-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditUser(u)}>ערוך</Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteAdminUser(u.id).then(loadData)}>מחק</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Department Edit Dialog */}
      <Dialog open={!!editDept} onOpenChange={() => setEditDept(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={editDept?.name || ''} onChange={e => setEditDept(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="שם המחלקה" />
            <Button className="w-full bg-[#2a7c7c]" onClick={handleUpdateDept}>עדכן מחלקה</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={editUser?.fullName || ''} onChange={e => setEditUser(prev => prev ? {...prev, fullName: e.target.value} : null)} placeholder="שם מלא" />
            <Button className="w-full bg-[#2a7c7c]" onClick={handleUpdateUser}>עדכן פרטי משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
