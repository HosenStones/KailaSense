'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, getAllDepartments, getGlobalQuestions,
  createDepartment, deleteDepartment, addGlobalQuestion,
  deleteGlobalQuestion, updateGlobalQuestion
} from '@/lib/firebase/firestore'
import { PREDEFINED_QUESTION_BANK } from '@/lib/question-bank'
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
  
  // States for Departments
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)

  // States for Users
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserRole, setEditUserRole] = useState<string>('')

  // States for Global Bank Editing & Adding
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [editingBankText, setEditingBankText] = useState('')
  
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
      setAllUsers(usersData.sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'he')));
      
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

  const handleSeedGlobalBank = async () => {
    try {
      for (const [category, items] of Object.entries(PREDEFINED_QUESTION_BANK)) {
        for (const item of items) { await addGlobalQuestion({ ...item, category, createdAt: new Date().toISOString() }); }
      }
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
    } catch (error) {}
  };

  const handleAddGlobalQuestion = async () => {
    if (!newBankQ.text.trim()) return;
    setIsSubmittingBank(true);
    try {
      const baseData: any = {
        text: newBankQ.text.trim(),
        type: newBankQ.type,
        category: newBankQ.category,
        tag: newBankQ.tag.trim() || 'כללי',
        createdAt: new Date().toISOString()
      };
      
      if (newBankQ.type === 'content') {
        baseData.contentType = newBankQ.contentType;
        if (newBankQ.contentUrl.trim()) baseData.contentUrl = newBankQ.contentUrl.trim();
        if (newBankQ.contentBody.trim()) baseData.contentBody = newBankQ.contentBody.trim();
      } else if (newBankQ.type === 'choice' || newBankQ.type === 'multi_choice') {
        baseData.options = newBankQ.optionsText.split(',').map(s => s.trim()).filter(s => s !== '');
      }

      await addGlobalQuestion(baseData);
      
      setNewBankQ({ text: '', type: 'emoji', category: 'general', tag: 'כללי', optionsText: '', contentType: 'info_text', contentUrl: '', contentBody: '' });
      setIsAddBankOpen(false);
      
      const bankData = await getGlobalQuestions();
      setGlobalBank(sortQuestions(bankData));
    } catch (e) { console.error(e); } 
    finally { setIsSubmittingBank(false); }
  };

  const handleSaveBankEdit = async (id: string) => {
    if (!editingBankText.trim()) return;
    try {
      await updateDoc(doc(db, 'global_questions', id), { text: editingBankText.trim() });
      const updated = globalBank.map(q => q.id === id ? { ...q, text: editingBankText.trim() } : q);
      setGlobalBank(sortQuestions(updated));
      setEditingBankId(null);
    } catch (e) {}
  };

  const handleDeleteGlobalQuestion = async (id: string) => {
    if (!confirm('למחוק שאלה מהמאגר הגלובלי? הפעולה לא תשפיע על מחלקות שכבר עשו בה שימוש.')) return;
    try { await deleteGlobalQuestion(id); setGlobalBank(prev => prev.filter(q => q.id !== id)); } catch (e) {}
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
    try { await deleteDoc(doc(db, 'users', id)); setAllUsers(prev => prev.filter(u => u.id !== id)); } catch (e) {}
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">טוען...</div>;
  if (status === 'error') return <div className="min-h-screen flex items-center justify-center text-sm text-destructive">שגיאה בגישה למערכת.</div>;

  const isSuperAdmin = currentUser?.role === 'super_admin';

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
              <Layers className="w-4 h-4 text-primary shrink-0" />
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
          <div className="bg-white border border-border rounded-2xl p-4 md:p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><UserCog className="w-4 h-4 text-primary"/> ניהול מערכת והרשאות</h2>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> הוסף מחלקה
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {departments.map(dept => {
                const deptUsers = allUsers.filter(u => u.departmentId === dept.id);
                return (
                  <div key={dept.id} className="border border-border rounded-xl p-3 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-800">{dept.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-slate-400 hover:text-destructive h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-100 overflow-x-auto shadow-sm">
                      <table className="w-full text-right text-xs min-w-[400px]">
                        <thead className="bg-slate-100/50 border-b border-slate-100 text-slate-500">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold text-right">אימייל</th>
                            <th className="py-2.5 px-3 font-semibold text-right">שם מלא</th>
                            <th className="py-2.5 px-3 font-semibold text-right">תפקיד</th>
                            <th className="py-2.5 px-3 font-semibold text-center w-16">פעולות</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {deptUsers.length > 0 ? deptUsers.map(user => {
                            const isEditing = editingUserId === user.id;
                            return (
                              <tr key={user.id} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 text-right" dir="ltr"><span className="text-slate-500 block truncate max-w-[120px]" title={user.email}>{user.email}</span></td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">{user.fullName || '-'}</td>
                                <td className="py-2 px-3 text-right">
                                  {isEditing ? (
                                    <Select value={editUserRole} onValueChange={setEditUserRole}>
                                      <SelectTrigger className="h-7 text-[10px] w-24"><SelectValue /></SelectTrigger>
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
                                      <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)} className="h-6 w-6 p-0"><X className="w-3 h-3"/></Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1 justify-center">
                                      <Button variant="ghost" size="sm" onClick={() => {setEditingUserId(user.id); setEditUserRole(user.role || 'staff');}} className="h-6 w-6 p-0 text-slate-400 hover:text-primary"><Pencil className="w-3 h-3"/></Button>
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
                );
              })}
            </div>

            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
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
          <div className="bg-white border border-border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> ניהול מאגר שאלות</h2>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddBankOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">
                  <Plus className="w-4 h-4 ml-1" /> הוסף שאלה למאגר
                </Button>
                {globalBank.length === 0 && (
                  <Button onClick={handleSeedGlobalBank} className="bg-blue-600 hover:bg-blue-700 text-xs h-9">
                    <Download className="w-4 h-4 ml-2" /> ייבוא התחלתי
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-right min-w-[700px]">
                <thead className="bg-slate-50 border-b border-border text-slate-600 text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-right w-24">מחלקה</th>
                    <th className="px-4 py-3 font-semibold text-right w-32">סטטוס</th>
                    <th className="px-4 py-3 font-semibold text-right w-36">סוג שאלה</th>
                    <th className="px-4 py-3 font-semibold text-right">טקסט השאלה / התוכן</th>
                    <th className="px-4 py-3 font-semibold text-center w-20">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {globalBank.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600 font-semibold text-right">{item.tag || 'כללי'}</td>
                      <td className="px-4 py-3 text-slate-600 text-right">{getCategoryLabel(item.category)}</td>
                      <td className="px-4 py-3 text-slate-600 text-right">{renderTypeLabelWithIcon(item.type, item.contentType)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 text-right">
                        {editingBankId === item.id ? (
                          <Input value={editingBankText} onChange={e => setEditingBankText(e.target.value)} className="h-8 text-xs w-full min-w-[200px]" />
                        ) : item.text}
                      </td>
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

            {/* חלון הוספת שאלה גלובלית */}
            <Dialog open={isAddBankOpen} onOpenChange={setIsAddBankOpen}>
              <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>הוספת שאלה למאגר הגלובלי</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">טקסט השאלה / כותרת</span>
                    <Input placeholder="לדוגמה: איך עברה הארוחה?" value={newBankQ.text} onChange={e => setNewBankQ({...newBankQ, text: e.target.value})} className="text-xs h-9" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">סטטוס (קטגוריה)</span>
                      <Select value={newBankQ.category} onValueChange={v => setNewBankQ({...newBankQ, category: v})}>
                        <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">סוג שאלה</span>
                      <Select value={newBankQ.type} onValueChange={v => setNewBankQ({...newBankQ, type: v})}>
                        <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">מחלקה (השאירי "כללי" אם מתאים לכולם)</span>
                    <Input placeholder="למשל: מיון, יולדות, כללי" value={newBankQ.tag} onChange={e => setNewBankQ({...newBankQ, tag: e.target.value})} className="text-xs h-9" />
                  </div>

                  {(newBankQ.type === 'choice' || newBankQ.type === 'multi_choice') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">אפשרויות בחירה (מופרדות בפסיק)</span>
                      <Input placeholder="רופא, אחות, צוות ניקיון" value={newBankQ.optionsText} onChange={e => setNewBankQ({...newBankQ, optionsText: e.target.value})} className="text-xs h-9" />
                    </div>
                  )}

                  {newBankQ.type === 'content' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <Select value={newBankQ.contentType} onValueChange={v => setNewBankQ({...newBankQ, contentType: v})}>
                        <SelectTrigger className="text-xs h-9"><SelectValue placeholder="סוג תוכן" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="info_text" className="text-xs">📝 טקסט בלבד</SelectItem>
                          <SelectItem value="image" className="text-xs">🖼️ תמונה + טקסט</SelectItem>
                          <SelectItem value="video" className="text-xs">🎬 סרטון וידאו</SelectItem>
                        </SelectContent>
                      </Select>
                      {(newBankQ.contentType === 'image' || newBankQ.contentType === 'video') && (
                        <Input placeholder="קישור ישיר למדיה (URL)" value={newBankQ.contentUrl} onChange={e => setNewBankQ({...newBankQ, contentUrl: e.target.value})} className="text-xs h-9 text-left" dir="ltr" />
                      )}
                      <textarea placeholder="תוכן / טקסט להצגה" value={newBankQ.contentBody} onChange={e => setNewBankQ({...newBankQ, contentBody: e.target.value})} className="w-full min-h-[80px] p-2.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                  )}

                  <Button onClick={handleAddGlobalQuestion} disabled={isSubmittingBank || !newBankQ.text.trim()} className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700">שמור למאגר</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  )
}
