'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { getAdminUserByEmail, getAllDepartments, getGlobalQuestions, createDepartment, deleteDepartment, addGlobalQuestion, deleteGlobalQuestion, updateGlobalQuestion } from '@/lib/firebase/firestore'
import { CATEGORIES, QUESTION_TYPES, ROLES, getCategoryLabel, getRoleLabel, renderTypeLabelWithIcon, sortQuestions } from '@/lib/constants'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminScheduling } from '@/components/admin/admin-scheduling'
import { AdminHeader } from '@/components/admin/admin-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Plus, Layers, BookOpen, Pencil, Save, X, UserCog, ChevronDown, ChevronUp, Library } from 'lucide-react'

type TabId = 'insights' | 'comments' | 'questions' | 'scheduling' | 'settings' | 'system' | 'bank'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)
  const [expandedSystemDepts, setExpandedSystemDepts] = useState<Record<string, boolean>>({})
  const toggleSystemDept = (id: string) => setExpandedSystemDepts(prev => ({...prev, [id]: !prev[id]}))
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserRole, setEditUserRole] = useState<string>('')
  const [editUserName, setEditUserName] = useState<string>('')
  const [editUserEmail, setEditUserEmail] = useState<string>('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserDept, setNewUserDept] = useState('')
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' })

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { setStatus('error'); return; }
      setCurrentUser(adminData);
      const allDepts = await getAllDepartments();
      setDepartments([...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any,b: any) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
      if (adminData.departmentId) setSelectedDepartment(adminData.departmentId);
      else if (allDepts.length > 0) setSelectedDepartment(allDepts[0].id);
      setStatus('ready');
    } catch (err) { setStatus('error'); }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/admin/login'); return; }
      if (user.email) loadData(user.email);
    });
    return () => unsubscribe();
  }, [router]);


const userRole = currentUser?.role || 'staff';
  const isAdmin = userRole === 'admin' || userRole === 'מנהל מערכת';
  const isManager = userRole === 'manager' || userRole === 'מנהל מחלקה';
  const canManageDepartment = isAdmin || isManager;
  const systemAdmins = allUsers.filter(u => u.role === 'admin' || u.role === 'מנהל מערכת');

  const navTabs = [{ id: 'insights', label: 'תובנות', icon: '📊' }, { id: 'comments', label: 'תגובות', icon: '💬' }, { id: 'scheduling', label: 'בקרה ומעקב', icon: '⏱️' }];
  if (canManageDepartment) navTabs.push({ id: 'questions', label: 'תכנים ושאלות', icon: '📋' }, { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' });
  if (isAdmin) navTabs.push({ id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, { id: 'bank', label: 'ניהול מאגר שאלות', icon: '📚' });

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    setIsSubmittingDept(true);
    try { await createDepartment({ name: newDeptName.trim() }); const allDepts = await getAllDepartments(); setDepartments([...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he'))); setNewDeptName(''); setIsAddDeptOpen(false); } catch (e) {} finally { setIsSubmittingDept(false); }
  };

  const handleAddNewUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    try {
      await addDoc(collection(db, 'users'), { email: newUser.email.trim(), fullName: newUser.fullName.trim(), role: newUser.role, departmentId: newUserDept === 'system' ? null : newUserDept, createdAt: new Date().toISOString() });
      setIsAddUserOpen(false); setNewUser({ email: '', fullName: '', role: 'staff' });
      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any,b: any) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
    } catch(e) {}
  };

  const handleDeleteUser = async (id: string) => { if (confirm('למחוק?')) { await deleteDoc(doc(db, 'users', id)); setAllUsers(prev => prev.filter(u => u.id !== id)); } }
  const handleSaveUserEdit = async (id: string) => { await updateDoc(doc(db, 'users', id), { role: editUserRole, fullName: editUserName, email: editUserEmail }); setAllUsers(prev => prev.map(u => u.id === id ? { ...u, role: editUserRole, fullName: editUserName, email: editUserEmail } : u)); setEditingUserId(null); }

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => canManageDepartment ? setActiveTab('settings') : null} />
      <div className="bg-white border-b border-[#e8e7f5] px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar max-w-full">
          {navTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabId)} className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 shrink-0 ${activeTab === tab.id ? 'text-[#2a7c7c] border-[#2a7c7c]' : 'text-slate-400 border-transparent'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} isReadOnly={!canManageDepartment} />}
        {canManageDepartment && activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {canManageDepartment && activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        {isAdmin && activeTab === 'system' && (
          <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-[#e8e7f5] pb-4">
              <h3 className="text-[#1e1c4a] font-bold text-lg flex items-center gap-2"><UserCog className="w-5 h-5 text-[#2a7c7c]"/> ניהול מערכת</h3>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-8 bg-[#2a7c7c] text-white"> הוסף מחלקה</Button>
            </div>
            <div className="bg-[#f0f9f9] border border-[#e8e7f5] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[#1e1c4a] mb-4">מנהלי מערכת</h3>
              <div className="flex flex-wrap gap-3">
                {systemAdmins.map(admin => (
                  <div key={admin.id} className="bg-white border border-[#e8e7f5] p-3 rounded-xl w-full md:w-[280px]">
                    {editingUserId === admin.id ? (
                      <>
                        <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="h-7 text-[10px] w-full mb-1" dir="ltr" />
                        <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="h-7 text-[10px] w-full mb-1" />
                        <Select value={editUserRole} onValueChange={setEditUserRole}><SelectTrigger className="h-7 text-[10px] w-full mb-2"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent></Select>
                        <div className="flex gap-1 justify-end"><Button size="sm" onClick={() => handleSaveUserEdit(admin.id)} className="h-6 px-2">שמור</Button><Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 px-2">X</Button></div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div><span className="font-bold block">{admin.fullName}</span><span className="text-slate-500 block">{admin.email}</span><span className="text-slate-400">{getRoleLabel(admin.role)}</span></div>
                        <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(admin.id); setEditUserRole(admin.role); setEditUserName(admin.fullName); setEditUserEmail(admin.email);}}><Pencil className="w-3 h-3"/></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {departments.map(dept => (
              <div key={dept.id} className="border rounded-xl bg-white p-4">
                <div className="flex justify-between cursor-pointer" onClick={() => toggleSystemDept(dept.id)}>
                   <h4 className="font-bold">{dept.name}</h4>
                   <Button size="sm" onClick={() => { setIsAddUserOpen(true); setNewUserDept(dept.id); }}>הוסף איש צוות</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
            <DialogHeader><DialogTitle>הוספת איש צוות</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="שם מלא" onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              <Input placeholder="אימייל" onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <Select onValueChange={v => setNewUser({...newUser, role: v})}><SelectTrigger><SelectValue placeholder="תפקיד" /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent></Select>
              <Button onClick={handleAddNewUser}>שמור</Button>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
