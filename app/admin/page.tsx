'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, 
  getAllDepartments, 
  getGlobalQuestions,
  createDepartment,
  deleteDepartment,
  addGlobalQuestion,
  deleteGlobalQuestion,
  updateGlobalQuestion
} from '@/lib/firebase/firestore'
import { PREDEFINED_QUESTION_BANK } from '@/lib/question-bank'
import { CATEGORIES, QUESTION_TYPES, ROLES, getCategoryLabel, getTypeLabel, getRoleLabel } from '@/lib/constants'
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
import { Trash2, Plus, Layers, BookOpen, Download, Pencil, Save, X, UserCog } from 'lucide-react'

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
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)

  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [editingBankText, setEditingBankText] = useState('')
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserRole, setEditUserRole] = useState<string>('')

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
      setAllUsers(usersData);
      
      const bankData = await getGlobalQuestions();
      const sortedBank = [...bankData].sort((a, b) => a.text.localeCompare(b.text, 'he'));
      setGlobalBank(sortedBank);
      
      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (sortedDepts.length > 0) {
        setSelectedDepartment(sortedDepts[0].id);
      }
      setStatus('ready');
    } catch (err) {
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
    if (!confirm('האם את בטוחה שברצונך למחוק מחלקה זו מהמערכת?')) return;
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleSeedGlobalBank = async () => {
    try {
      for (const [category, items] of Object.entries(PREDEFINED_QUESTION_BANK)) {
        for (const item of items) {
          await addGlobalQuestion({ ...item, category, createdAt: new Date().toISOString() });
        }
      }
      const bankData = await getGlobalQuestions();
      setGlobalBank([...bankData].sort((a, b) => a.text.localeCompare(b.text, 'he')));
    } catch (error) { console.error(error); }
  };

  const handleSaveBankEdit = async (id: string) => {
    if (!editingBankText.trim()) return;
    try {
      await updateGlobalQuestion(id, { text: editingBankText.trim() });
      const updated = globalBank.map(q => q.id === id ? { ...q, text: editingBankText.trim() } : q);
      setGlobalBank([...updated].sort((a, b) => a.text.localeCompare(b.text, 'he')));
      setEditingBankId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteGlobalQuestion = async (id: string) => {
    if (!confirm('למחוק שאלה זו מהמאגר?')) return;
    try {
      await deleteGlobalQuestion(id);
      setGlobalBank(prev => prev.filter(q => q.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleSaveUserEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role: editUserRole });
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, role: editUserRole } : u));
      setEditingUserId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('למחוק משתמש זה מהמערכת?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setAllUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) { console.error(e); }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">טוען את נתוני המערכת...</div>;
  if (status === 'error') return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-destructive">שגיאה בטעינת הנתונים. ודאי כי המשתמש מורשה גישה.</div>;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab('settings')} />
      
      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <div className="flex flex-col md:flex-row md:justify-between items-center w-full gap-4">
          <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar">
            {[
              { id: 'insights', label: 'תובנות', icon: '📊' },
              { id: 'comments', label: 'תגובות', icon: '💬' },
              { id: 'questions', label: 'תכנים ושאלות', icon: '📋' },
              { id: 'scheduling', label: 'בקרה ומעקב', icon: '⏱️' },
              { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' },
              ...(isSuperAdmin ? [{ id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, { id: 'bank', label: 'מאגר שאלות', icon: '📚' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 pb-2 md:pb-0">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">מחלקה:</span>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 w-48 bg-background border-border text-foreground text-xs">
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
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><UserCog className="w-4 h-4 text-primary"/> ניהול מערכת והרשאות</h2>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> הוסף מחלקה
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map(dept => {
                const deptUsers = allUsers.filter(u => u.departmentId === dept.id);
                return (
                  <div key={dept.id} className="border border-border rounded-xl p-3 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-800">{dept.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-slate-400 hover:text-destructive h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                          <tr>
                            <th className="py-2 px-3 font-semibold">צוות</th>
                            <th className="py-2 px-3 font-semibold text-center">פעולות</th>
                            <th className="py-2 px-3 font-semibold">שם מלא</th>
                            <th className="py-2 px-3 font-semibold">אימייל</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {deptUsers.length > 0 ? deptUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3">
                                {editingUserId === user.id ? (
                                  <Select value={editUserRole} onValueChange={setEditUserRole}>
                                    <SelectTrigger className="h-7 text-[10px] w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent dir="rtl">
                                      {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-[10px]">{r.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {getRoleLabel(user.role || 'staff')}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {editingUserId === user.id ? (
                                  <div className="flex gap-1 justify-center">
                                    <Button size="sm" onClick={() => handleSaveUserEdit(user.id)} className="h-6 w-6 p-0 bg-emerald-600"><Save className="w-3 h-3"/></Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 w-6 p-0"><X className="w-3 h-3"/></Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1 justify-center">
                                    <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(user.id); setEditUserRole(user.role || 'staff');}} className="h-6 w-6 p-0 text-slate-400 hover:text-primary"><Pencil className="w-3 h-3"/></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-destructive"><Trash2 className="w-3 h-3"/></Button>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-700">{user.name || '-'}</td>
                              <td className="py-2 px-3 text-slate-500">{user.email}</td>
                            </tr>
                          )) : <tr><td colSpan={4} className="p-3 text-center text-xs text-slate-400">אין משתמשים במחלקה.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>הוספת מחלקה חדשה</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="שם המחלקה" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                  <Button onClick={handleCreateDepartment} disabled={isSubmittingDept} className="w-full">צור מחלקה</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'bank' && isSuperAdmin && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> מאגר שאלות</h2>
              </div>
              {globalBank.length === 0 && (
                <Button onClick={handleSeedGlobalBank} className="bg-blue-600 hover:bg-blue-700 text-xs h-9">
                  <Download className="w-4 h-4 ml-2" /> ייבוא התחלתי
                </Button>
              )}
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-border text-slate-600 text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">טקסט השאלה / התוכן</th>
                    <th className="px-4 py-3 font-semibold">סוג שאלה</th>
                    <th className="px-4 py-3 font-semibold">סטטוס</th>
                    <th className="px-4 py-3 font-semibold">מחלקה</th>
                    <th className="px-4 py-3 font-semibold text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {globalBank.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {editingBankId === item.id ? (
                          <Input value={editingBankText} onChange={e => setEditingBankText(e.target.value)} className="h-8 text-xs w-full" />
                        ) : item.text}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{getTypeLabel(item.type)}</td>
                      <td className="px-4 py-3 text-slate-600">{getCategoryLabel(item.category)}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{item.tag || 'כללי'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {editingBankId === item.id ? (
                            <>
                              <Button size="sm" onClick={() => handleSaveBankEdit(item.id)} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white px-2"><Save className="w-3 h-3" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingBankId(null)} className="h-7 px-2 text-slate-500"><X className="w-3 h-3" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => {setEditingBankId(item.id); setEditingBankText(item.text);}} className="text-slate-400 hover:text-slate-700 h-7 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteGlobalQuestion(item.id)} className="text-slate-400 hover:text-destructive h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {globalBank.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">המאגר ריק.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
