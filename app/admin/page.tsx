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
  deleteGlobalQuestion
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
import { Trash2, Plus, Layers, BookOpen, Download } from 'lucide-react'

type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [isSubmittingDept, setIsSubmittingDept] = useState(false)
  const [isSeedingBank, setIsSeedingBank] = useState(false)

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { 
        setStatus('error'); 
        return; 
      }
      setCurrentUser(adminData);
      
      const allDepts = await getAllDepartments();
      setDepartments(allDepts);
      
      const bankData = await getGlobalQuestions();
      setGlobalBank(bankData);
      
      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id);
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
      setDepartments(allDepts);
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

  // פונקציה שמייבאת את השאלות מהקובץ למסד הנתונים
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
      alert('השאלות נטענו בהצלחה למסד הנתונים!');
    } catch (error) {
      console.error("Error seeding bank:", error);
      alert('אירעה שגיאה בטעינת השאלות.');
    } finally {
      setIsSeedingBank(false);
    }
  };

  const handleDeleteGlobalQuestion = async (id: string) => {
    if (!confirm('למחוק שאלה זו מהמאגר הגלובלי? הפעולה לא תמחק אותה ממחלקות שכבר משתמשות בה.')) return;
    try {
      await deleteGlobalQuestion(id);
      setGlobalBank(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      console.error(e);
    }
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

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab('settings')} />
      
      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar w-full md:w-auto">
          {[
            { id: 'insights', label: 'תובנות', icon: '📊' },
            { id: 'comments', label: 'תגובות', icon: '💬' },
            { id: 'questions', label: 'תכנים ושאלות', icon: '📋' },
            { id: 'scheduling', label: 'בקרה ומעקב', icon: '⏱️' },
            { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' },
            { id: 'system', label: 'ניהול מערכת', icon: '🛡️' }, 
            { id: 'bank', label: 'בנק שאלות', icon: '📚' }
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
      </div>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-700">מחלקה בניהול:</span>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-full sm:w-72 bg-background border-border text-foreground">
              <SelectValue placeholder="בחרי מחלקה לניהול" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
        
        {activeTab === 'system' && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">ניהול מחלקות ומשתמשי מערכת</h2>
                <p className="text-xs text-muted-foreground">הוספה, מחיקה ועדכון פרטי מחלקות בבית החולים</p>
              </div>
              <Button onClick={() => setIsAddDeptOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> הוסף מחלקה חדשה
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{dept.name}</h4>
                    <p className="text-[11px] text-muted-foreground">מזהה פנימי: {dept.id}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
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

        {activeTab === 'bank' && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> מאגר שאלות קליני גלובלי
                </h2>
                <p className="text-xs text-muted-foreground mt-1">צפייה ועריכה של כלל השאלות המוגדרות כברירת מחדל במערכת</p>
              </div>
              
              {globalBank.length === 0 && (
                <Button onClick={handleSeedGlobalBank} disabled={isSeedingBank} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 ml-2" />
                  {isSeedingBank ? 'מייבא שאלות...' : 'ייבוא שאלות למסד הנתונים'}
                </Button>
              )}
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-border text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">טקסט השאלה / התוכן</th>
                    <th className="px-4 py-3 font-semibold">סוג שאלה</th>
                    <th className="px-4 py-3 font-semibold">קטגוריית שלב</th>
                    <th className="px-4 py-3 font-semibold">תג מחלקתי</th>
                    <th className="px-4 py-3 font-semibold text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {globalBank.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.text}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{item.type}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-semibold">{item.tag || 'כללי'}</td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteGlobalQuestion(item.id)}
                          className="text-slate-400 hover:text-destructive hover:bg-red-50 h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {globalBank.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="w-8 h-8 text-slate-300" />
                          <span>לא נמצאו שאלות גלובליות במסד הנתונים.</span>
                          <span>לחצי על "ייבוא שאלות למסד הנתונים" כדי לטעון אותן מהקובץ.</span>
                        </div>
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
