'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllDepartments, updateDepartment, getUsersByDepartment, createAdminUser, updateAdminUser, deleteAdminUser } from '@/lib/firebase/firestore'
import { ROLES, getRoleLabel } from '@/lib/constants'
import type { Department, AdminUser } from '@/lib/types'
import { Pencil, Save, Trash2, X, UserPlus } from 'lucide-react'

export function AdminSettings({ departmentId }: { departmentId: string }) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' })

  const loadData = async () => {
    if (!departmentId) return;
    const all = await getAllDepartments()
    const current = all.find(d => d.id === departmentId)
    if (current) {
      setDepartment(current)
      setName(current.name)
    }
    const deptUsers = await getUsersByDepartment(departmentId)
    deptUsers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'he'))
    setUsers(deptUsers)
  }

  useEffect(() => { loadData() }, [departmentId])

  const handleSaveName = async () => {
    if (!department) return
    setIsSaving(true)
    await updateDepartment(department.id, { name })
    setMessage('שם המחלקה עודכן בהצלחה')
    setTimeout(() => setMessage(''), 3000)
    setIsSaving(false)
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    await createAdminUser(`user_${Date.now()}`, {
      email: newUser.email, fullName: newUser.fullName, role: newUser.role as any, departmentId
    });
    setNewUser({ email: '', fullName: '', role: 'staff' });
    setIsAddUserOpen(false);
    await loadData();
  }

  const handleSaveUserEdit = async () => {
    if (!editUser) return;
    await updateAdminUser(editUser.id, { 
      email: editUser.email, fullName: editUser.fullName, role: editUser.role 
    });
    setEditUser(null);
    await loadData();
  }

  const handleDeleteUser = async (id: string) => {
    if(!confirm('למחוק איש צוות זה מהמחלקה?')) return;
    await deleteAdminUser(id);
    await loadData();
  }

  if (!department) return <div className="p-4 text-center text-sm text-slate-500">טוען נתוני מחלקה...</div>

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">שם מחלקה</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full sm:max-w-xs text-xs h-9" />
          <Button onClick={handleSaveName} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white h-9 px-6 text-xs">
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
        {message && <p className="text-emerald-600 text-xs mt-2 font-bold">{message}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">צוות המחלקה ({users.length})</h3>
          <Button onClick={() => setIsAddUserOpen(true)} className="bg-primary hover:bg-primary/90 text-white h-8 text-xs gap-2">
            <UserPlus className="w-3.5 h-3.5" /> הוסף איש צוות
          </Button>
        </div>
        
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
          {users.length === 0 ? (
            <p className="text-xs text-slate-400 text-center p-6">אין אנשי צוות משויכים למחלקה זו.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-right">אימייל</th>
                    <th className="py-2.5 px-4 font-semibold text-right">שם מלא</th>
                    <th className="py-2.5 px-4 font-semibold text-right">תפקיד</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isEditing = editUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="py-2 px-4 text-right" dir="ltr">
                          {isEditing ? <Input value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="h-7 text-xs" /> : <span className="text-slate-500">{u.email}</span>}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {isEditing ? <Input value={editUser.fullName} onChange={e => setEditUser({...editUser, fullName: e.target.value})} className="h-7 text-xs" /> : <span className="font-medium text-slate-800">{u.fullName}</span>}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {isEditing ? (
                            <Select value={editUser.role} onValueChange={r => setEditUser({...editUser, role: r})}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent dir="rtl">
                                {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                              {getRoleLabel(u.role || 'staff')}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" onClick={handleSaveUserEdit} className="h-6 w-6 p-0 bg-emerald-600 text-white"><Save className="w-3 h-3"/></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditUser(null)} className="h-6 w-6 p-0 text-slate-500"><X className="w-3 h-3"/></Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <Button variant="ghost" size="sm" onClick={() => setEditUser(u)} className="h-6 w-6 p-0 text-slate-400 hover:text-primary"><Pencil className="w-3 h-3"/></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-destructive"><Trash2 className="w-3 h-3"/></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent dir="rtl" className="bg-white">
          <DialogHeader><DialogTitle>הוספת איש צוות למחלקה</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="text-xs h-9" />
            <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" className="text-xs h-9" />
            <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r})}>
              <SelectTrigger className="text-xs h-9"><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
              <SelectContent dir="rtl">
                {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleAddUser} disabled={!newUser.email || !newUser.fullName} className="w-full text-xs h-9">צור משתמש</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
