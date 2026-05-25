'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, getAllDepartments, getGlobalQuestions,
  createDepartment, deleteDepartment, addGlobalQuestion,
  deleteGlobalQuestion, updateGlobalQuestion, createAdminUser
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

type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

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
      setAllUsers(usersData.sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
      
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
      
      if (adminData.departmentId) setSelectedDepartment(adminData.departmentId);
      else if (sortedDepts.length > 0) setSelectedDepartment(sortedDepts[0].id);
      
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

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      await createDepartment({ name: newDeptName.trim() });
      const allDepts = await getAllDepartments();
      setDepartments([...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      setNewDeptName('');
      setIsAddDeptOpen(false);
    } catch (e) {}
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('למחוק מחלקה זו מהמערכת?')) return;
    try { await deleteDepartment(id); setDepartments(prev => prev.filter(d => d.id !== id)); } catch (e) {}
  };

  const resetBankForm = () => {
    setNewBankQ({ text: '', type: 'emoji', category: 'general', tag: 'כללי', optionsText: '', contentType: 'info_text', contentUrl: '', contentBody: '' });
    setEditingBankId(null);
  };

  const handleSaveBankQuestion = async () => {
    if (!newBankQ.text.trim()) return;
    try {
      const baseData: any = {
        text: newBankQ.text.trim(), type: newBankQ.type, category: newBankQ.category, tag: newBankQ.tag,
        createdAt: new Date().toISOString()
      };
      if (newBankQ.type === 'content') {
        baseData.contentType = newBankQ.contentType;
        if (newBankQ.contentUrl.trim()) baseData.contentUrl = newBankQ.contentUrl.trim();
        if (newBankQ.contentBody.trim()) baseData.contentBody = newBankQ.contentBody.trim();
      } else if (newBankQ.type === 'choice' || newBankQ.type === 'multi_choice') {
        baseData.options = newBankQ.optionsText.split(',').map(s => s.trim()).filter(s => s !== '');
      }

      if (editingBankId) {
        await updateDoc(doc(db, 'global_questions', editingBankId), baseData);
      } else {
        await addGlobalQuestion(baseData);
      }
      
      resetBankForm();
      setIsAddBankOpen(false);
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
    } catch (e) {}
  };

  const handleEditBankClick = (item: any) => {
    setEditingBankId(item.id);
    setNewBankQ({
      text: item.text || '', type: item.type || 'emoji', category: item.category || 'general', tag: item.tag || 'כללי',
      optionsText: item.options ? item.options.join(', ') : '',
      contentType: item.contentType || 'info_text', contentUrl: item.contentUrl || '', contentBody: item.contentBody || ''
    });
    setIsAddBankOpen(true); // Open the dialog for editing
  };

  const handleDeleteGlobalQuestion = async (id: string) => {
    if (!confirm('למחוק שאלה ממאגר השאלות?')) return;
    try { await deleteGlobalQuestion(id); setGlobalBank(prev => prev.filter(q => q.id !== id)); } catch (e) {}
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    await createAdminUser(`user_${Date.now()}`, {
      email: newUser.email, fullName: newUser.fullName, role: newUser.role as any, departmentId: newUserDept
    });
    setNewUser({ email: '', fullName: '', role: 'staff' });
    setIsAddUserOpen(false);
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllUsers(usersData.sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
  }

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

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">טוען...</div>;
  if (status === 'error') return <div className="min-h-screen flex items-center justify-center text-sm text-destructive">שגיאה בגישה.</div>;

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const superAdmins = allUsers.filter(u => u.role === 'super_admin');

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab('settings')} />
      
      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <div className="flex flex-col md:flex-row md:justify-between items-center w-full gap-4">
          <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar max-w-full">
            {[
              { id: 'insights', label: 'תובנות', icon: '📊' },
              { id: 'comments', label: 'תגובות', icon: '💬' },
              { id: 'questions', label: 'תכנים ושאלות', icon: '📋' },
              { id: 'scheduling', label: 'בקרה ומעקב', icon: '⏱️' },
              { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' },
              ...(isSuperAdmin ? [{ id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, { id: 'bank', label: 'ניהול מאגר שאלות', icon: '📚' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 shrink-0 ${activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 pb-2 md:pb-0">
              <Layers className="w-4 h-4 text-slate-800 shrink-0" />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">מחלקה:</span>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 w-full sm:w-48 bg-background border-border text-xs">
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
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        
        {activeTab === 'system' && isSuperAdmin && (
          <div className="bg-white border border-border rounded-2xl p-4 md:p-5 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><UserCog className="w-4 h-4 text-slate-800"/> ניהול מערכת והרשאות</h2>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-8 bg-primary text-white">
                <Plus className="w-3.5 h-3.5" /> הוסף מחלקה
              </Button>
            </div>

            <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-4 mb-4">
              <div className="flex justify-between items-center w-full max-w-3xl">
                <h3 className="text-xs font-bold text-slate-800">מנהלי מערכת</h3>
                <Button size="sm" onClick={() => { setIsAddUserOpen(true); setNewUserDept('system'); setNewUser({...newUser, role: 'super_admin'}); }} className="h-7 text-[10px] gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Plus className="w-3 h-3"/> הוסף מנהל מערכת
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 justify-center w-full max-w-3xl">
                {superAdmins.map(admin => {
                  const isEditing = editingUserId === admin.id;
                  return (
                    <div key={admin.id} className="bg-white border border-slate-200 p-2.5 rounded-lg flex flex-col gap-2 text-xs shadow-sm w-full md:w-[280px]">
                      {isEditing ? (
                        <>
                          <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="h-7 text-[10px] w-full" dir="ltr" />
                          <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="h-7 text-[10px] w-full" />
                          <div className="flex gap-1 justify-end mt-1">
                            <Button size="sm" onClick={() => handleSaveUserEdit(admin.id)} className="h-6 px-2 bg-emerald-600 text-white"><Save className="w-3 h-3"/></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 px-2"><X className="w-3 h-3"/></Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{admin.fullName || '-'}</span>
                            <span className="text-slate-500">{admin.email}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(admin.id); setEditUserRole('super_admin'); setEditUserName(admin.fullName || ''); setEditUserEmail(admin.email || '');}} className="h-6 w-6 p-0 text-slate-400 hover:text-primary"><Pencil className="w-3.5 h-3.5"/></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(admin.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></Button>
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
                const deptUsers = allUsers.filter(u => u.departmentId === dept.id && u.role !== 'super_admin');
                const isExpanded = expandedSystemDepts[dept.id];
                return (
                  <div key={dept.id} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-border cursor-pointer w-full hover:bg-slate-100/50 transition-colors" onClick={() => toggleSystemDept(dept.id)}>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        {dept.name} ({deptUsers.length})
                      </h4>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleSystemDept(dept.id)}>{isExpanded ? 'סגור' : 'פתח'}</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-slate-400 hover:text-destructive h-7 w-7 p-0"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-3 bg-white">
                        <div className="flex justify-end mb-2">
                          <Button size="sm" className="h-7 text-[10px] gap-1 bg-primary text-white hover:bg-primary/90" onClick={() => { setIsAddUserOpen(true); setNewUserDept(dept.id); setNewUser({ email: '', fullName: '', role: 'staff' }); }}>
                            <Plus className="w-3 h-3"/> הוסף איש צוות
                          </Button>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-100 overflow-x-auto">
                          <table className="w-full text-right text-xs min-w-[500px]">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <tr>
                                <th className="py-2.5 px-3 font-semibold text-right">אימייל</th>
                                <th className="py-2.5 px-3 font-semibold text-right">שם מלא</th>
                                <th className="py-2.5 px-3 font-semibold text-right">תפקיד</th>
                                <th className="py-2.5 px-3 font-semibold text-center w-20">פעולות</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {deptUsers.length > 0 ? deptUsers.map(user => {
                                const isEditing = editingUserId === user.id;
                                return (
                                  <tr key={user.id} className="hover:bg-slate-50/80">
                                    <td className="py-2 px-3 text-right" dir="ltr">
                                      {isEditing ? <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="h-7 text-[10px] w-full bg-white" /> : <span className="text-slate-500">{user.email}</span>}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {isEditing ? <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="h-7 text-[10px] w-full bg-white" /> : <span className="font-medium text-slate-700">{user.fullName || '-'}</span>}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {isEditing ? (
                                        <Select value={editUserRole} onValueChange={setEditUserRole}>
                                          <SelectTrigger className="h-7 text-[10px] w-24 bg-white"><SelectValue /></SelectTrigger>
                                          <SelectContent dir="rtl">
                                            {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-[10px]">{r.label}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                          {getRoleLabel(user.role || 'staff')}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {isEditing ? (
                                        <div className="flex gap-1 justify-center">
                                          <Button size="sm" onClick={() => handleSaveUserEdit(user.id)} className="h-6 w-6 p-0 bg-emerald-600 text-white"><Save className="w-3 h-3"/></Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 w-6 p-0 bg-white"><X className="w-3 h-3"/></Button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1 justify-center">
                                          <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(user.id); setEditUserRole(user.role || 'staff'); setEditUserName(user.fullName || ''); setEditUserEmail(user.email || '');}} className="h-6 w-6 p-0 text-slate-400 hover:text-primary"><Pencil className="w-3 h-3"/></Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-destructive"><Trash2 className="w-3 h-3"/></Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              }) : <tr><td colSpan={4} className="p-3 text-center text-xs text-slate-400">אין משתמשים במחלקה.</td></tr>}
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
                <DialogHeader><DialogTitle>הוספת מחלקה חדשה</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="bg-white" />
                  <Button onClick={handleCreateDepartment} disabled={isSubmittingDept} className="w-full bg-primary text-white">צור מחלקה</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
                <DialogHeader><DialogTitle>הוספת איש צוות</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="שם מלא" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="text-xs h-9 bg-white" />
                  <Input placeholder="אימייל" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} dir="ltr" className="text-xs h-9 bg-white" />
                  <Select value={newUser.role} onValueChange={r => setNewUser({...newUser, role: r})}>
                    <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddUser} disabled={!newUser.email || !newUser.fullName} className="w-full text-xs h-9 bg-primary text-white">צור משתמש</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'bank' && isSuperAdmin && (
          <div className="bg-white border border-border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-800" /> ניהול מאגר שאלות</h2>
              </div>
              <Button onClick={() => { resetBankForm(); setIsAddBankOpen(true); }} className="bg-primary text-white hover:bg-primary/90 text-xs h-8">
                <Plus className="w-4 h-4 ml-1" /> הוסף שאלה
              </Button>
            </div>

            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const catItems = globalBank.filter(item => item.category === cat.id);
                if (catItems.length === 0) return null;
                const isExpanded = expandedBankCats[cat.id] ?? false; // Default closed
                
                // Grouping by department inside the category
                const deptGroups: Record<string, any[]> = {};
                catItems.forEach(item => {
                  const tag = item.tag || 'כללי';
                  if (!deptGroups[tag]) deptGroups[tag] = [];
                  deptGroups[tag].push(item);
                });
                // Sorting departments: 'כללי' first, then A-Z
                const sortedDepts = Object.keys(deptGroups).sort((a, b) => {
                  if (a === 'כללי') return -1;
                  if (b === 'כללי') return 1;
                  return a.localeCompare(b, 'he');
                });

                return (
                  <div key={cat.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 border-b border-border cursor-pointer w-full hover:bg-slate-100/50 transition-colors" onClick={() => toggleBankCat(cat.id)}>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        {cat.label} ({catItems.length})
                      </h4>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={(e) => { e.stopPropagation(); toggleBankCat(cat.id); }}>
                        {isExpanded ? 'סגור' : 'פתח'}
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="p-3 bg-white space-y-4">
                        {sortedDepts.map(deptName => (
                          <div key={deptName} className="space-y-2">
                            <h5 className="text-xs font-bold text-primary border-b border-slate-100 pb-1">{deptName}</h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {deptGroups[deptName].map((item, idx) => (
                                <div key={item.id || idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white text-slate-600 border border-slate-200">{renderTypeLabelWithIcon(item.type, item.contentType)}</span>
                                    </div>
                                    <span className="text-slate-800 text-xs font-medium">{item.text}</span>
                                  </div>
                                  <div className="flex gap-1 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditBankClick(item)} className="h-7 px-2 text-slate-400 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGlobalQuestion(item.id)} className="h-7 px-2 text-slate-400 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Dialog open={isAddBankOpen} onOpenChange={setIsAddBankOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingBankId ? 'עריכת שאלה במאגר' : 'הוספת שאלה'}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">טקסט השאלה / כותרת</span>
                    <Input placeholder="לדוגמה: איך עברה הארוחה?" value={newBankQ.text} onChange={e => setNewBankQ({...newBankQ, text: e.target.value})} className="text-xs h-9 bg-white" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">סטטוס (קטגוריה)</span>
                      <Select value={newBankQ.category} onValueChange={v => setNewBankQ({...newBankQ, category: v})}>
                        <SelectTrigger className="text-xs h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">סוג שאלה</span>
                      <Select value={newBankQ.type} onValueChange={v => setNewBankQ({...newBankQ, type: v})}>
                        <SelectTrigger className="text-xs h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">מחלקה</span>
                    <Select value={newBankQ.tag} onValueChange={v => setNewBankQ({...newBankQ, tag: v})}>
                      <SelectTrigger className="text-xs h-9 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="כללי" className="text-xs">כללי</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {(newBankQ.type === 'choice' || newBankQ.type === 'multi_choice') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">אפשרויות בחירה (מופרדות בפסיק)</span>
                      <Input placeholder="רופא, אחות, צוות ניקיון" value={newBankQ.optionsText} onChange={e => setNewBankQ({...newBankQ, optionsText: e.target.value})} className="text-xs h-9 bg-white" />
                    </div>
                  )}

                  {newBankQ.type === 'content' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <Select value={newBankQ.contentType} onValueChange={v => setNewBankQ({...newBankQ, contentType: v})}>
                        <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="סוג תוכן" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="info_text" className="text-xs">📝 טקסט בלבד</SelectItem>
                          <SelectItem value="image" className="text-xs">🖼️ תמונה + טקסט</SelectItem>
                          <SelectItem value="video" className="text-xs">🎬 סרטון וידאו</SelectItem>
                        </SelectContent>
                      </Select>
                      {(newBankQ.contentType === 'image' || newBankQ.contentType === 'video') && (
                        <Input placeholder="קישור ישיר למדיה (URL)" value={newBankQ.contentUrl} onChange={e => setNewBankQ({...newBankQ, contentUrl: e.target.value})} className="text-xs h-9 text-left bg-white" dir="ltr" />
                      )}
                      <textarea placeholder="תוכן / טקסט להצגה" value={newBankQ.contentBody} onChange={e => setNewBankQ({...newBankQ, contentBody: e.target.value})} className="w-full min-h-[80px] p-2.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-primary outline-none bg-white" />
                    </div>
                  )}

                  <Button onClick={handleSaveBankQuestion} disabled={isSubmittingBank || !newBankQ.text.trim()} className="w-full text-xs h-9 bg-primary hover:bg-primary/90 text-white">שמור</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  )
}
