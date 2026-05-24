'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, 
  getAllDepartments, 
  getGlobalQuestions,
  createDepartment,
  deleteDepartment,
  addGlobalQuestion,
  deleteGlobalQuestion,
  updateGlobalQuestion,
  getAllAdminUsersSorted
} from '@/lib/firebase/firestore'
import { PREDEFINED_QUESTION_BANK } from '@/lib/question-bank'
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
import { Trash2, Plus, Layers, BookOpen, Download, Pencil, Save, X } from 'lucide-react'

type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)
  const [isSeedingBank, setIsSeedingBank] = useState(false)

  // Inline editing state for global question bank
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [editingBankText, setEditingBankText] = useState('')

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { 
        setStatus('error'); 
        return; 
      }
      setCurrentUser(adminData);
      
      const allDepts = await getAllDepartments();
      // Sort departments alphabetically
      const sortedDepts = [...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he'));
      setDepartments(sortedDepts);
      
      const usersData = await getAllAdminUsersSorted(sortedDepts);
      setAllUsers(usersData);
      
      const bankData = await getGlobalQuestions();
      setGlobalBank(bankData);
      
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
      if (!user) { 
        router.push('/admin/login'); 
        return; 
      }
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
      const sortedDepts = [...allDepts].sort((a, b) => a.name.localeCompare(b.name, 'he'));
      setDepartments(sortedDepts);
      setNewDeptName('');
      setIsAddDeptOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק מחלקה זו מהמערכת?')) return;
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedGlobalBank = async () => {
    if (!confirm('פעולה זו תעתיק את כל השאלות מהקובץ המקומי לתוך מסד הנתונים. להמשיך?')) return;
    setIsSeedingBank(true);
    try {
      for (const [category, items] of Object.entries(PREDEFINED_QUESTION_BANK)) {
        for (const item of items) {
          await addGlobalQuestion({
            ...item,
            category,
            createdAt: new Date().toISOString()
          });
        }
      }
      const bankData = await getGlobalQuestions();
      setGlobalBank(bankData);
    } catch (error) {
      console.error("Error seeding bank:", error);
    } finally {
      setIsSeedingBank(false);
    }
  };

  const handleStartEditBank = (item: any) => {
    setEditingBankId(item.id);
    setEditingBankText(item.text);
  };

  const handleSaveBankEdit = async (id: string) => {
    if (!editingBankText.trim()) return;
    try {
      await updateGlobalQuestion(id, { text: editingBankText.trim() });
      setGlobalBank(prev => prev.map(q => q.id === id ? { ...q, text: editingBankText.trim() } : q));
      setEditingBankId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGlobalQuestion = async (id: string) => {
    if (!confirm('למחוק שאלה זו מהמאגר?')) return;
    try {
      await deleteGlobalQuestion(id);
      setGlobalBank(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const translateCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      admission: 'שקף קבלה',
      during: 'מהלך אשפוז',
      discharge: 'לקראת שחרור',
      after_discharge: 'לאחר שחרור',
      general: 'כללי'
    };
    return mapping[cat] || cat;
  };

  const translateType = (type: string) => {
    const mapping: Record<string, string> = {
      emoji: 'אימוג׳י',
      stars: 'כוכבים',
      choice: 'בחירה יחידה',
      multi_choice: 'בחירה מרובה',
      open_text: 'טקסט חופשי',
      content: 'שקף מידע'
    };
    return mapping[type] || type;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        טוען את נתוני המערכת...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-destructive">
        שגיאה בטעינת הנתונים. ודאי כי המשתמש קיים ומורשה גישה.
      </div>
    );
  }

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
              ...(isSuperAdmin ? [
                { id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, 
                { id: 'bank', label: 'מאגר שאלות', icon: '📚' }
              ] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {/* Department Selector aligned nicely on the left of the navigation row */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 pb-2 md:pb-0">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">מחלקה בניהול:</span>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 w-48 bg-background border-border text-foreground text-xs">
                  <SelectValue placeholder="בחרי מחלקה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="text-xs">
                      {dept.name}
                    </SelectItem>
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
        
        {/* System Tab Workspace View */}
        {activeTab === 'system' && isSuperAdmin && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">ניהול מחלקות ומשתמשי מערכת</h2>
                <p className="text-xs text-muted-foreground">צפייה במחלקות, בצוות הרפואי ובמשתמשי המערכת המשויכים אליהן</p>
              </div>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2 text-xs h-9">
                <Plus className="w-4 h-4" /> הוסף מחלקה חדשה
              </Button>
            </div>

            <div className="space-y-4">
              {departments.map(dept => {
                const deptUsers = allUsers.filter(u => u.departmentId === dept.id);
                return (
                  <div key={dept.id} className="border border-border rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-800">{dept.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                      {deptUsers.length > 0 ? (
                        deptUsers.map(user => (
                          <div key={user.id} className="p-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-semibold text-slate-700 block">{user.name || 'משתמש ללא שם'}</span>
                              <span className="text-slate-400">{user.email}</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                              {user.role === 'super_admin' ? 'מנהל על' : 'מנהל מחלקה'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">لا يوجد משתמשים רשומים תחת מחלקה זו.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>הוספת מחלקה חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input 
                    placeholder="שם המחלקה (לדוגמה: מיון נשים, אורתופדיה)" 
                    value={newDeptName} 
                    onChange={e => setNewDeptName(e.target.value)}
                  />
                  <Button onClick={handleCreateDepartment} disabled={isSubmittingDept} className="w-full">
                    {isSubmittingDept ? 'יוצר מחלקה...' : 'צור מחלקה'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Global Bank Tab Workspace View */}
        {activeTab === 'bank' && isSuperAdmin && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">מאגר שאלות</h2>
                <p className="text-xs text-muted-foreground mt-1">צפייה, עריכה ועדכון של כלל השאלות המובנות במערכת</p>
              </div>
              
              {globalBank.length === 0 && (
                <Button onClick={handleSeedGlobalBank} disabled={isSeedingBank} className="bg-blue-600 hover:bg-blue-700 text-xs h-9">
                  <Download className="w-4 h-4 ml-2" />
                  {isSeedingBank ? 'מייבא שאלות...' : 'ייבוא שאלות למסד הנתונים'}
                </Button>
              )}
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-border text-slate-600 text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">טקסט השאלה / התוכן</th>
                    <th className="px-4 py-3 font-semibold">סוג שאלה</th>
                    <th className="px-4 py-3 font-semibold">קטגוריית שלב</th>
                    <th className="px-4 py-3 font-semibold">תג מחלקתי</th>
                    <th className="px-4 py-3 font-semibold text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {globalBank.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {editingBankId === item.id ? (
                          <Input 
                            value={editingBankText} 
                            onChange={e => setEditingBankText(e.target.value)} 
                            className="h-8 text-xs w-full"
                          />
                        ) : (
                          item.text
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{translateType(item.type)}</td>
                      <td className="px-4 py-3 text-slate-500">{translateCategory(item.category)}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{item.tag || 'כללי'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {editingBankId === item.id ? (
                            <>
                              <Button size="sm" onClick={() => handleSaveBankEdit(item.id)} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white px-2">
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingBankId(null)} className="h-7 px-2 text-slate-500">
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleStartEditBank(item)} className="text-slate-400 hover:text-slate-700 h-7 px-2">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteGlobalQuestion(item.id)} className="text-slate-400 hover:text-destructive h-7 px-2">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {globalBank.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        לא נמצאו שאלות במסד הנתונים. לחצי על כפתור הייבוא כדי לטעון אותן.
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
