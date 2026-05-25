'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, getAllDepartments, getGlobalQuestions,
  createDepartment, deleteDepartment, addGlobalQuestion,
  deleteGlobalQuestion, updateGlobalQuestion
} from '@/lib/firebase/firestore'
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
import { Trash2, Plus, Layers, BookOpen, Pencil, Save, X, UserCog, ChevronDown, ChevronUp } from 'lucide-react'

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

  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [expandedBankCats, setExpandedBankCats] = useState<Record<string, boolean>>({})
  const toggleBankCat = (id: string) => setExpandedBankCats(prev => ({...prev, [id]: !prev[id]}))
  
  const [isAddBankOpen, setIsAddBankOpen] = useState(false)
  const [isSubmittingBank, setIsSubmittingBank] = useState(false)
  const [newBankQ, setNewBankQ] = useState({
    text: '', type: 'emoji', category: 'general', tag: 'כללי', 
    optionsText: '', contentType: 'info_text', contentUrl: '', contentBody: ''
  })

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { setStatus('error'); return; }
      setCurrentUser(adminData);
      
      const allDepts = await getAllDepartments();
      const sortedDepts = [...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he'));
      setDepartments(sortedDepts);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData.sort((a: any, b: any) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
      
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
      
      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (sortedDepts.length > 0) {
        setSelectedDepartment(sortedDepts[0].id);
      }
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

  const navTabs = [
    { id: 'insights', label: 'תובנות', icon: '📊' },
    { id: 'comments', label: 'תגובות', icon: '💬' },
    { id: 'scheduling', label: 'בקרה ומעקב', icon: '⏱️' }
  ];

  if (canManageDepartment) {
    navTabs.push(
      { id: 'questions', label: 'תכנים ושאלות', icon: '📋' },
      { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' }
    );
  }

  if (isAdmin) {
    navTabs.push(
      { id: 'system', label: 'ניהול מערכת', icon: '🛡️' }
    );
  }

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    setIsSubmittingDept(true);
    try {
      await createDepartment({ name: newDeptName.trim() });
      const allDepts = await getAllDepartments();
      setDepartments([...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      setNewDeptName('');
      setIsAddDeptOpen(false);
    } catch (e) { console.error(e); } 
    finally { setIsSubmittingDept(false); }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('למחוק מחלקה זו מהמערכת?')) return;
    try { await deleteDepartment(id); setDepartments(prev => prev.filter(d => d.id !== id)); } catch (e) {}
  };

  const handleAddNewUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    try {
      await addDoc(collection(db, 'users'), {
        email: newUser.email.trim(),
        fullName: newUser.fullName.trim(),
        role: newUser.role,
        departmentId: newUserDept === 'system' ? null : newUserDept,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsAddUserOpen(false);
      setNewUser({ email: '', fullName: '', role: 'staff' });
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData.sort((a: any,b: any) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
    } catch(e) {}
  };

  const handleSaveUserEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role: editUserRole, fullName: editUserName, email: editUserEmail });
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, role: editUserRole, fullName: editUserName, email: editUserEmail } : u));
      setEditingUserId(null);
    } catch (e) {}
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('למחוק משתמש זה מהמערכת?')) return;
    try { await deleteDoc(doc(db, 'users', id)); setAllUsers(prev => prev.filter(u => u.id !== id)); } catch (e) {}
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-[#2a7c7c]">טוען...</div>;
  if (status === 'error') return <div className="min-h-screen flex items-center justify-center text-sm text-red-500">שגיאה בגישה למערכת.</div>;

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => canManageDepartment ? setActiveTab('settings') : null} />
      
      <div className="bg-white border-b border-[#e8e7f5] px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <div className="flex flex-col md:flex-row md:justify-between items-center w-full gap-4">
          <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar max-w-full">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 shrink-0 ${activeTab === tab.id ? 'text-[#2a7c7c] border-[#2a7c7c]' : 'text-slate-400 border-transparent'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {isAdmin && (
            <div className="flex items-center gap-2 pb-2 md:pb-0">
              <Layers className="w-4 h-4 text-slate-800 shrink-0" />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">מחלקה:</span>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 w-full sm:w-48 bg-white border-[#e8e7f5] text-xs">
                  <SelectValue placeholder="בחרי מחלקה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-xs">{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        
        {/* Pass isReadOnly state for Staff members */}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} isReadOnly={!canManageDepartment} />}
        
        {canManageDepartment && activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {canManageDepartment && activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        
        {isAdmin && activeTab === 'system' && (
          <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#e8e7f5] pb-4">
              <h3 className="text-[#1e1c4a] font-bold text-lg flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#2a7c7c]"/> ניהול מערכת
              </h3>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-8 bg-[#2a7c7c] text-white hover:bg-[#206060]">
                <Plus className="w-3.5 h-3.5" /> הוסף מחלקה
              </Button>
            </div>

            <div className="bg-[#f0f9f9] border border-[#e8e7f5] rounded-xl p-5 flex flex-col items-center justify-center space-y-4 mb-4">
              <div className="flex justify-between items-center w-full max-w-3xl">
                <h3 className="text-xs font-bold text-[#1e1c4a]">מנהלי מערכת</h3>
              </div>
              <div className="flex flex-wrap gap-3 justify-center w-full max-w-3xl">
                {systemAdmins.map(admin => {
                  const isEditing = editingUserId === admin.id;
                  return (
                    <div key={admin.id} className="bg-white border border-[#e8e7f5] p-3 rounded-xl flex flex-col gap-2 text-xs shadow-sm w-full md:w-[280px]">
                      {isEditing ? (
                        <>
                          <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="h-7 text-[10px] w-full" dir="ltr" />
                          <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="h-7 text-[10px] w-full" />
                          <Select value={editUserRole} onValueChange={setEditUserRole}>
                            <SelectTrigger className="h-7 text-[10px] w-full bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-[10px]">{r.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1 justify-end mt-1">
                            <Button size="sm" onClick={() => handleSaveUserEdit(admin.id)} className="h-6 px-2 bg-[#2a7c7c] text-white"><Save className="w-3 h-3"/></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 px-2"><X className="w-3 h-3"/></Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#1e1c4a] block">{admin.fullName || '-'}</span>
                            <span className="text-slate-500 block">{admin.email}</span>
                            <span className="text-slate-400 mt-1 inline-block">{getRoleLabel(admin.role)}</span>
                          </div>
                          <div className="flex gap-1 self-start">
                            <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(admin.id); setEditUserRole(admin.role || 'admin'); setEditUserName(admin.fullName || ''); setEditUserEmail(admin.email || '');}} className="h-6 w-6 p-0 text-slate-400 hover:text-[#2a7c7c]"><Pencil className="w-3.5 h-3.5"/></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(admin.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {departments.map(dept => {
                const deptUsers = allUsers.filter(u => u.departmentId === dept.id && u.role !== 'admin' && u.role !== 'מנהל מערכת');
                const isExpanded = expandedSystemDepts[dept.id];
                return (
                  <div key={dept.id} className="border border-[#e8e7f5] rounded-xl bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-4 bg-[#f7f7fc] border-b border-[#e8e7f5] cursor-pointer w-full hover:bg-slate-50 transition-colors" onClick={() => toggleSystemDept(dept.id)}>
                      <h4 className="text-sm font-bold text-[#1e1c4a] flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#2a7c7c]"/> : <ChevronDown className="w-4 h-4 text-[#2a7c7c]"/>}
                        {dept.name} ({deptUsers.length})
                      </h4>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={() => toggleSystemDept(dept.id)}>{isExpanded ? 'סגור' : 'פתח'}</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-slate-400 hover:text-red-500 h-7 w-7 p-0"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="flex justify-end mb-3">
                          <Button size="sm" className="h-8 text-[11px] gap-1 bg-[#2a7c7c] text-white hover:bg-[#206060]" onClick={() => { setIsAddUserOpen(true); setNewUserDept(dept.id); setNewUser({ email: '', fullName: '', role: 'staff' }); }}>
                            <Plus className="w-3 h-3"/> הוסף איש צוות
                          </Button>
                        </div>
                        <div className="bg-white rounded-lg border border-[#e8e7f5] overflow-x-auto">
                          <table className="w-full text-right text-xs min-w-[500px]">
                            <thead className="bg-[#f7f7fc] border-b border-[#e8e7f5] text-slate-500">
                              <tr>
                                <th className="py-3 px-4 font-semibold text-right">אימייל</th>
                                <th className="py-3 px-4 font-semibold text-right">שם מלא</th>
                                <th className="py-3 px-4 font-semibold text-right">תפקיד</th>
                                <th className="py-3 px-4 font-semibold text-center w-20">פעולות</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e8e7f5]">
                              {deptUsers.length > 0 ? deptUsers.map(user => {
                                const isEditing = editingUserId === user.id;
                                return (
                                  <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="py-2 px-4 text-right" dir="ltr">
                                      {isEditing ? <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="h-7 text-[10px] w-full bg-white border-[#e8e7f5]" /> : <span className="text-slate-500">{user.email}</span>}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                      {isEditing ? <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="h-7 text-[10px] w-full bg-white border-[#e8e7f5]" /> : <span className="font-medium text-[#1e1c4a]">{user.fullName || '-'}</span>}
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                      {isEditing ? (
                                        <Select value={editUserRole} onValueChange={setEditUserRole}>
                                          <SelectTrigger className="h-7 text-[10px] w-24 bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
                                          <SelectContent dir="rtl">
                                            {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-[10px]">{r.label}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="bg-[#f0f9f9] text-[#2a7c7c] px-2 py-1 rounded text-[10px] font-medium border border-[#b2dfdf]">
                                          {getRoleLabel(user.role || 'staff')}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                      {isEditing ? (
                                        <div className="flex gap-1 justify-center">
                                          <Button size="sm" onClick={() => handleSaveUserEdit(user.id)} className="h-6 w-6 p-0 bg-[#2a7c7c] text-white"><Save className="w-3 h-3"/></Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 w-6 p-0 bg-white"><X className="w-3 h-3"/></Button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1 justify-center">
                                          <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(user.id); setEditUserRole(user.role || 'staff'); setEditUserName(user.fullName || ''); setEditUserEmail(user.email || '');}} className="h-6 w-6 p-0 text-slate-400 hover:text-[#2a7c7c]"><Pencil className="w-3.5 h-3.5"/></Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              }) : <tr><td colSpan={4} className="p-4 text-center text-xs text-slate-400">אין אנשי צוות משויכים למחלקה זו.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
                <DialogHeader><DialogTitle className="text-[#1e1c4a]">הוספת מחלקה חדשה</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="bg-white border-[#e8e7f5]" />
                  <Button onClick={handleCreateDepartment} disabled={isSubmittingDept} className="w-full bg-[#2a7c7c] hover:bg-[#206060] text-white">צור מחלקה</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
                <DialogHeader><DialogTitle className="text-[#1e1c4a]">הוספת איש צוות</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="bg-white border-[#e8e7f5] text-xs h-10" />
                  <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="bg-white border-[#e8e7f5] text-xs h-10" dir="ltr" />
                  <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                    <SelectTrigger className="bg-white border-[#e8e7f5] text-xs h-10"><SelectValue placeholder="תפקיד" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {ROLES.filter(r => r.id !== 'admin').map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddNewUser} disabled={!newUser.email || !newUser.fullName} className="w-full bg-[#2a7c7c] hover:bg-[#206060] text-white font-bold h-10 text-xs">שמור איש צוות</Button>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        )}
      </main>
    </div>
  )
}
