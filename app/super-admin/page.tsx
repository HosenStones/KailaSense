'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUser, 
  getAllDepartments, 
  getAllAdminUsers,
  createDepartment,
  deleteDepartment,
  createAdminUser,
  deleteAdminUser,
  copyDefaultQuestionsToDepartment
} from '@/lib/firebase/firestore'
import type { Department, AdminUser } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TabId = 'departments' | 'users'

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('departments')
  
  // New department form
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptNameEn, setNewDeptNameEn] = useState('')
  const [isAddingDept, setIsAddingDept] = useState(false)
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'super_admin'>('admin')
  const [newUserDeptId, setNewUserDeptId] = useState<string>('')
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)

  useEffect(() => {
    if (!auth) {
      router.push('/admin/login')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login')
        return
      }

      // Check if user is super_admin
      const adminUser = await getAdminUser(user.uid)
      if (!adminUser || adminUser.role !== 'super_admin') {
        router.push('/admin')
        return
      }

      setCurrentUser(adminUser)
      await loadData()
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadData = async () => {
    const [depts, users] = await Promise.all([
      getAllDepartments(),
      getAllAdminUsers()
    ])
    setDepartments(depts)
    setAdminUsers(users)
  }

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      router.push('/admin/login')
    }
  }

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return
    
    setIsAddingDept(true)
    try {
      const deptId = await createDepartment({
        name: newDeptName.trim(),
        nameEn: newDeptNameEn.trim() || undefined,
      })
      
      // Copy default questions to new department
      await copyDefaultQuestionsToDepartment(deptId)
      
      await loadData()
      setNewDeptName('')
      setNewDeptNameEn('')
      setDeptDialogOpen(false)
    } catch (error) {
      console.error('Error adding department:', error)
      alert('שגיאה ביצירת מחלקה')
    } finally {
      setIsAddingDept(false)
    }
  }

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    if (!confirm(`האם למחוק את המחלקה "${deptName}"? כל הנתונים יימחקו!`)) return
    
    try {
      await deleteDepartment(deptId)
      await loadData()
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('שגיאה במחיקת מחלקה')
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim()) return
    
    setIsAddingUser(true)
    try {
      // Generate a temporary ID - in real app, user would register first
      const tempId = `user_${Date.now()}`
      await createAdminUser(tempId, {
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
        role: newUserRole,
        departmentId: newUserRole === 'admin' ? newUserDeptId : null,
      })
      
      await loadData()
      setNewUserEmail('')
      setNewUserName('')
      setNewUserRole('admin')
      setNewUserDeptId('')
      setUserDialogOpen(false)
    } catch (error) {
      console.error('Error adding user:', error)
      alert('שגיאה ביצירת משתמש')
    } finally {
      setIsAddingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`האם למחוק את המשתמש "${userName}"?`)) return
    
    try {
      await deleteAdminUser(userId)
      await loadData()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('שגיאה במחיקת משתמש')
    }
  }

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return 'כל המחלקות'
    const dept = departments.find(d => d.id === deptId)
    return dept?.name || 'לא ידוע'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center">
        <div className="text-[#3d9e9e]">טוען...</div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'departments', label: 'מחלקות', icon: '🏥' },
    { id: 'users', label: 'משתמשים', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f7fc]" dir="rtl">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-[#1a5c5c] to-[#2a7c7c] h-14 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors">
            <Image
              src="/images/kaila-logo-horizontal.png"
              alt="Kaila - לחץ לחזרה לסקר"
              width={100}
              height={30}
              className="h-6 w-auto"
            />
          </Link>
          <span className="text-white/70 text-sm border-r border-white/20 pr-4">סופר אדמין</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 bg-[#ffd700] rounded-full flex items-center justify-center text-xs font-bold text-[#1a5c5c]">
              S
            </div>
            <span className="text-white text-sm font-semibold">{currentUser?.fullName || 'סופר אדמין'}</span>
          </div>

          <Link href="/admin">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/15 text-sm border border-white/25 rounded-lg px-3 py-1.5 h-auto"
            >
              ממשק מנהלים
            </Button>
          </Link>

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
      <div className="bg-white border-b border-[#e8e7f5] flex gap-1 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-[3px] transition-colors ${
              activeTab === tab.id
                ? 'text-[#1a5c5c] border-[#2a7c7c]'
                : 'text-[#a8a6c4] border-transparent hover:text-[#6b6890]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'departments' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1e1c4a]">ניהול מחלקות</h2>
              <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
                    + הוסף מחלקה
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>הוספת מחלקה חדשה</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-[#1e1c4a]">שם המחלקה (עברית)</label>
                      <Input
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="לדוגמה: מחלקה כירורגית"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1e1c4a]">שם המחלקה (אנגלית - אופציונלי)</label>
                      <Input
                        value={newDeptNameEn}
                        onChange={(e) => setNewDeptNameEn(e.target.value)}
                        placeholder="e.g. Surgical Department"
                        className="mt-1"
                        dir="ltr"
                      />
                    </div>
                    <Button
                      onClick={handleAddDepartment}
                      disabled={isAddingDept || !newDeptName.trim()}
                      className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white"
                    >
                      {isAddingDept ? 'יוצר...' : 'צור מחלקה'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Departments List */}
            <div className="bg-white rounded-xl border border-[#e8e7f5] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f7f7fc]">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">שם המחלקה</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">שם באנגלית</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">מנהלים</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">קישור לסקר</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => {
                    const deptAdmins = adminUsers.filter(u => u.departmentId === dept.id)
                    return (
                      <tr key={dept.id} className="border-t border-[#e8e7f5]">
                        <td className="px-4 py-3 text-sm font-medium text-[#1e1c4a]">{dept.name}</td>
                        <td className="px-4 py-3 text-sm text-[#6b6890]">{dept.nameEn || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#6b6890]">{deptAdmins.length} מנהלים</td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-[#f7f7fc] px-2 py-1 rounded text-[#2a7c7c]">
                            /survey/{dept.id}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/survey/${dept.id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                צפה
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            >
                              מחק
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#a8a6c4]">
                        אין מחלקות. לחץ על &quot;הוסף מחלקה&quot; כדי להתחיל.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1e1c4a]">ניהול משתמשים</h2>
              <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2a7c7c] hover:bg-[#236969] text-white">
                    + הוסף משתמש
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>הוספת משתמש חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-[#1e1c4a]">שם מלא</label>
                      <Input
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="לדוגמה: ד״ר ישראל ישראלי"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1e1c4a]">אימייל</label>
                      <Input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="example@hospital.org"
                        className="mt-1"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1e1c4a]">תפקיד</label>
                      <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as 'admin' | 'super_admin')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">מנהל מחלקה</SelectItem>
                          <SelectItem value="super_admin">סופר אדמין</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUserRole === 'admin' && (
                      <div>
                        <label className="text-sm font-medium text-[#1e1c4a]">מחלקה</label>
                        <Select value={newUserDeptId} onValueChange={setNewUserDeptId}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="בחר מחלקה" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      onClick={handleAddUser}
                      disabled={isAddingUser || !newUserEmail.trim() || !newUserName.trim() || (newUserRole === 'admin' && !newUserDeptId)}
                      className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white"
                    >
                      {isAddingUser ? 'יוצר...' : 'צור משתמש'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl border border-[#e8e7f5] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f7f7fc]">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">שם</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">אימייל</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">תפקיד</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">מחלקה</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#6b6890]">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="border-t border-[#e8e7f5]">
                      <td className="px-4 py-3 text-sm font-medium text-[#1e1c4a]">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-[#6b6890]" dir="ltr">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          user.role === 'super_admin'
                            ? 'bg-[#fff3cd] text-[#856404]'
                            : 'bg-[#e5f3f3] text-[#2a7c7c]'
                        }`}>
                          {user.role === 'super_admin' ? 'סופר אדמין' : 'מנהל מחלקה'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6b6890]">
                        {getDepartmentName(user.departmentId)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.id === currentUser?.id ? 'את/ה' : 'מחק'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {adminUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#a8a6c4]">
                        אין משתמשים. לחץ על &quot;הוסף משתמש&quot; כדי להתחיל.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
