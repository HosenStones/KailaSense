'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllDepartments, updateDepartment, getUsersByDepartment, createAdminUser, updateAdminUser, deleteAdminUser } from '@/lib/firebase/firestore'
import type { Department, AdminUser } from '@/lib/types'

export function AdminSettings({ departmentId }: { departmentId: string }) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // ניהול משתמשים
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' as any })

  const loadData = async () => {
    if (!departmentId) return;
    const all = await getAllDepartments()
    const current = all.find(d => d.id === departmentId)
    if (current) {
      setDepartment(current)
      setName(current.name)
    }
    const deptUsers = await getUsersByDepartment(departmentId)
    deptUsers.sort((a, b) => (a.role === 'admin' ? -1 : 1))
    setUsers(deptUsers)
  }

  useEffect(() => {
    loadData()
  }, [departmentId])

  const handleSaveName = async () => {
    if (!department) return
    setIsSaving(true)
    await updateDepartment(department.id, { name })
    setMessage('השם עודכן בהצלחה')
    setTimeout(() => setMessage(''), 3000)
    setIsSaving(false)
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    await createAdminUser(`user_${Date.now()}`, {
      email: newUser.email, fullName: newUser.fullName, role: newUser.role, departmentId
    });
    setNewUser({ email: '', fullName: '', role: 'staff' });
    setIsAddUserOpen(false);
    await loadData();
  }

  const handleUpdateUser = async () => {
    if (!editUser) return;
    await updateAdminUser(editUser.id, {
      fullName: editUser.fullName, email: editUser.email, role: editUser.role
    });
    setEditUser(null);
    await loadData();
  }

  if (!department) return <div className="p-4 text-center">טוען...</div>

  return (
    <div className="max-w-3xl bg-white rounded-2xl border border-[#e8e7f5] p-6 space-y-8" dir="rtl">
      <div>
        <h3 className="text-lg font-bold text-[#1e1c4a] mb-4">עריכת שם המחלקה</h3>
        <div className="flex gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
          <Button onClick={handleSaveName} disabled={isSaving} className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
        {message && <p className="text-[#2a7c7c] text-sm mt-2 font-bold">{message}</p>}
      </div>

      <div className="pt-6 border-t border-[#e8e7f5]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#1e1c4a]">צוות המחלקה ({users.length})</h3>
          <Button onClick={() => setIsAddUserOpen(true)} className="bg-[#2a7c7c] hover:bg-[#236969] text-white" size="sm">+ הוסף איש צוות</Button>
        </div>
        
        <div className="bg-[#f7f7fc] rounded-xl p-4 border border-[#e8e7f5]">
          {users.length === 0 ? (
            <p className="text-sm text-[#6b6890] text-center p-4">אין אנשי צוות משויכים למחלקה זו.</p>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="border-b border-[#e8e7f5] text-[#a8a6c4]">
                <tr><th className="pb-2">שם מלא</th><th className="pb-2">אימייל</th><th className="pb-2">תפקיד</th><th className="pb-2">פעולות</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[#e8e7f5] last:border-0 hover:bg-white">
                    <td className="py-3 font-medium text-[#1e1c4a]">{u.fullName}</td>
                    <td className="py-3 text-[#6b6890]" dir="ltr">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-[#7dd3d3] text-[#1a5c5c]' : 'bg-gray-200 text-gray-700'}`}>
                        {u.role === 'admin' ? 'מנהל' : 'צוות'}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditUser(u)}>ערוך</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteAdminUser(u.id).then(loadData)}>מחק</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* דיאלוגים למנהל מחלקה */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספת איש צוות למחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
            <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" />
            <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r as any})}>
              <SelectTrigger><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="staff">צוות (צפייה בלבד)</SelectItem>
                <SelectItem value="admin">מנהל מחלקה</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddUser} className="bg-[#2a7c7c] hover:bg-[#236969] w-full text-white">צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>עריכת משתמש</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם מלא" value={editUser?.fullName || ''} onChange={e => setEditUser({...editUser!, fullName: e.target.value})} />
            <Input placeholder="אימייל" value={editUser?.email || ''} onChange={e => setEditUser({...editUser!, email: e.target.value})} dir="ltr" />
            <Select value={editUser?.role || ''} onValueChange={r => setEditUser({...editUser!, role: r as any})}>
              <SelectTrigger><SelectValue placeholder="תפקיד" /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="staff">צוות (צפייה בלבד)</SelectItem>
                <SelectItem value="admin">מנהל מחלקה</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateUser} className="bg-[#2a7c7c] hover:bg-[#236969] w-full text-white">שמור שינויים</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
