'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getAdminUserByEmail, 
  getAllDepartments, 
  getAllAdminUsersSorted,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  copyDefaultQuestionsToDepartment,
  getGlobalQuestions,
  addGlobalQuestion,
  updateGlobalQuestion,
  deleteGlobalQuestion
} from '@/lib/firebase/firestore'
import type { AdminUser, Department } from '@/lib/types'
import { AdminInsights } from '@/components/admin/admin-insights'
import { AdminQuestions } from '@/components/admin/admin-questions'
import { AdminComments } from '@/components/admin/admin-comments'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminScheduling } from '@/components/admin/admin-scheduling'
import { AdminHeader } from '@/components/admin/admin-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Pencil } from 'lucide-react'

// Defined tabs for the admin dashboard
type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

// Initial static bank list to seed the database
const INITIAL_BANK_QUESTIONS = [
  { text: "איך הרגשת בקבלתך למחלקה?", type: "emoji", category: "admission", tag: "כללי" },
  { text: "האם קיבלת הסבר ברור על תהליך האשפוז?", type: "choice", category: "admission", tag: "כללי", options: ["כן, הכל היה ברור", "באופן חלקי", "לא, חסר לי מידע"] },
  { text: "איך היית מדרג/ת את יחס הצוות הסיעודי עד כה?", type: "stars", category: "during", tag: "כללי" },
  { text: "אילו מהשירותים הבאים סייעו לך ביותר במהלך האשפוז?", type: "multi_choice", category: "during", tag: "כללי", options: ["תזונאית", "עובדת סוציאלית", "פיזיותרפיה", "ייעוץ רוקחי", "הדרכת אחות"] },
  { text: "מהם הדברים שהיו חסרים לך בחדר או במחלקה?", type: "multi_choice", category: "during", tag: "כללי", options: ["שמיכה נוספת", "כריות", "מגבות", "סבון ושמפו", "מים קרים", "ניקיון"] },
  { text: "מי מאנשי הצוות העניק לך את הטיפול המשמעותי ביותר?", type: "multi_choice", category: "during", tag: "כללי", options: ["אחות משמרת", "רופא מטפל", "כוח עזר", "צוות ניקיון"] },
  { text: "האם את/ה מרגיש/ה מוכן/ה לשחרור הביתה?", type: "emoji", category: "discharge", tag: "כללי" },
  { text: "אילו נושאים היית רוצה לקבל עליהם מידע נוסף לקראת השחרור?", type: "multi_choice", category: "discharge", tag: "כללי", options: ["המשך טיפול תרופתי", "תזונה מומלצת", "פעילות גופנית מותרת", "מתי להגיע לביקורת", "למי לפנות במקרה חירום"] },
  { text: "איך את/ה מסכם/ת את חווית האשפוז שלך?", type: "stars", category: "general", tag: "כללי" }
];

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // Modals visibility state
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isBankItemOpen, setIsBankItemOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editBankItem, setEditBankItem] = useState<any | null>(null)
  
  // Forms state
  const [newDeptName, setNewDeptName] = useState('')
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'staff' as any, deptId: '' })
  const [bankItemForm, setBankItemForm] = useState({ text: '', type: 'emoji', category: 'general', options: '', tag: 'כללי' })

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { setStatus('error'); return; }
      setCurrentUser(adminData);

      const allDepts = await getAllDepartments();
      setDepartments(allDepts);

      if (adminData.role === 'super_admin') {
        const allUsers = await getAllAdminUsersSorted(allDepts);
        setAdminUsers(allUsers);
        const bankData = await getGlobalQuestions();
        setGlobalBank(bankData);
      }

      if (adminData.departmentId) {
        setSelectedDepartment(adminData.departmentId);
      } else if (allDepts.length > 0) {
        setSelectedDepartment(allDepts[0].id);
      }
      setStatus('ready');
    } catch (err) {
      console.error("Error loading data:", err);
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

  const handleAddDept = async () => {
    if (!newDeptName) return;
    const id = await createDepartment({ name: newDeptName });
    await copyDefaultQuestionsToDepartment(id);
    setNewDeptName(''); setIsAddDeptOpen(false);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleUpdateDept = async () => {
    if (!editDept) return;
    await updateDepartment(editDept.id, { name: editDept.name });
    setEditDept(null);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.fullName) return;
    await createAdminUser(`user_${Date.now()}`, {
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      departmentId: newUser.role === 'super_admin' ? null : newUser.deptId
    });
    setNewUser({ email: '', fullName: '', role: 'staff', deptId: '' });
    setIsAddUserOpen(false);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleUpdateUser = async () => {
    if (!editUser) return;
    await updateAdminUser(editUser.id, {
      fullName: editUser.fullName,
      email: editUser.email,
      role: editUser.role,
      departmentId: editUser.role === 'super_admin' ? null : editUser.departmentId
    });
    setEditUser(null);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleSeedBank = async () => {
    if (!confirm('Are you sure you want to load default questions?')) return;
    for (const item of INITIAL_BANK_QUESTIONS) {
      await addGlobalQuestion(item);
    }
    if (currentUser?.email) loadData(currentUser.email);
  }

  const handleSaveBankItem = async () => {
    if (!bankItemForm.text) return;
    const dataToSave: any = {
      text: bankItemForm.text,
      type: bankItemForm.type,
      category: bankItemForm.category,
      tag: bankItemForm.tag
    };
    
    if (bankItemForm.type === 'choice' || bankItemForm.type === 'multi_choice') {
      dataToSave.options = bankItemForm.options.split(',').map(s => s.trim()).filter(s => s !== '');
    }

    if (editBankItem) {
      await updateGlobalQuestion(editBankItem.id, dataToSave);
    } else {
      await addGlobalQuestion(dataToSave);
    }
    
    setIsBankItemOpen(false);
    setEditBankItem(null);
    if (currentUser?.email) loadData(currentUser.email);
  }

  const openBankItemModal = (item?: any) => {
    if (item) {
      setEditBankItem(item);
      setBankItemForm({
        text: item.text,
        type: item.type,
        category: item.category,
        tag: item.tag || 'כללי',
        options: item.options ? item.options.join(', ') : ''
      });
    } else {
      setEditBankItem(null);
      setBankItemForm({ text: '', type: 'emoji', category: 'general', tag: 'כללי', options: '' });
    }
    setIsBankItemOpen(true);
  }

  const sortedUsers = [...adminUsers].sort((a, b) => {
    if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
    if (a.role !== 'super_admin' && b.role === 'super_admin') return 1;
    const deptA = departments.find(d => d.id === a.departmentId)?.name || '';
    const deptB = departments.find(d => d.id === b.departmentId)?.name || '';
    const deptComp = deptA.localeCompare(deptB, 'he');
    if (deptComp !== 0) return deptComp;
    return a.fullName.localeCompare(b.fullName, 'he');
  });

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center font-bold text-primary">Loading...</div>

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="ממשק ניהול" onProfileClick={() => setActiveTab(currentUser?.role === 'super_admin' ? 'system' : 'settings')} />

      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 md:gap-0 pt-2 md:pt-0">
        <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar w-full md:w-auto">
          {[
            { id: 'insights', label: 'תובנות', icon: '📊' },
            { id: 'comments', label: 'תגובות', icon: '💬' },
            ...(currentUser?.role !== 'staff' ? [
              { id: 'questions', label: 'שאלות', icon: '📋' },
              { id: 'scheduling', label: 'תזמונים ומעקב', icon: '⏱️' },
              { id: 'settings', label: 'הגדרות מחלקה', icon: '⚙️' }
            ] : []),
            ...(currentUser?.role === 'super_admin' ? [
              { id: 'system', label: 'ניהול מערכת', icon: '🛡️' },
              { id: 'bank', label: 'בנק שאלות', icon: '📚' }
            ] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-4 md:px-5 h-full text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-card-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {currentUser?.role === 'super_admin' && (
          <div className={`flex items-center gap-3 transition-opacity mb-2 md:mb-0 ${(activeTab === 'system' || activeTab === 'bank') ? 'opacity-0 pointer-events-none hidden md:flex' : 'opacity-100'}`}>
            <span className="text-sm font-bold text-card-foreground">מחלקה:</span>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48 h-9 text-right bg-background border-border text-foreground cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-popover-foreground cursor-pointer">{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

     <main className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="bg-transparent md:p-6 min-h-[500px]">
          {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
          {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
          {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
          {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} />}
          {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
          
          {activeTab === 'bank' && currentUser?.role === 'super_admin' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <Button onClick={() => openBankItemModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer">
                  + שאלה חדשה לבנק
                </Button>
                {globalBank.length === 0 && (
                  <Button onClick={handleSeedBank} variant="outline" className="border-border font-bold cursor-pointer text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                    טען שאלות ברירת מחדל
                  </Button>
                )}
              </div>

              <div className="bg-card rounded-xl p-5 text-card-foreground shadow-sm">
                <h2 className="font-bold text-card-foreground mb-4 text-lg border-b border-border pb-2">מאגר השאלות המרכזי</h2>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-right border-collapse min-w-[600px]">
                    <thead>
                      <tr className="text-muted-foreground text-sm border-b border-border">
                        <th className="pb-3 font-semibold">תוכן השאלה</th>
                        <th className="pb-3 font-semibold">סוג מענה</th>
                        <th className="pb-3 font-semibold">קטגוריה/שלב</th>
                        <th className="pb-3 w-32 font-semibold">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalBank.map(item => (
                        <tr key={item.id} className="border-b border-secondary last:border-0 hover:bg-secondary/80 transition-colors">
                          <td className="py-3.5 font-medium text-card-foreground pl-4">{item.text}</td>
                          <td className="py-3.5 text-muted-foreground text-sm">
                            {item.type === 'multi_choice' ? 'רב ברירה' : item.type === 'choice' ? 'בחירה יחידה' : item.type === 'emoji' ? 'אימוג\'י' : item.type === 'stars' ? 'כוכבים' : item.type}
                          </td>
                          <td className="py-3.5 text-muted-foreground text-sm">{item.category}</td>
                          <td className="py-3.5 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openBankItemModal(item)} className="text-blue-600 hover:bg-blue-50 cursor-pointer"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => { if(confirm('למחוק מהבנק?')) deleteGlobalQuestion(item.id).then(() => loadData(currentUser!.email)) }}><Trash2 className="w-4 h-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && currentUser?.role === 'super_admin' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setIsAddDeptOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer">+ מחלקה חדשה</Button>
                <Button onClick={() => setIsAddUserOpen(true)} variant="outline" className="border-border bg-card text-foreground hover:bg-secondary font-bold cursor-pointer"> + איש צוות חדש</Button>
              </div>
              {/* ... שאר טבלאות המערכת ... */}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isBankItemOpen} onOpenChange={setIsBankItemOpen}>
        <DialogContent dir="rtl" className="bg-card border-border text-card-foreground w-[90vw] max-w-md">
          <DialogHeader><DialogTitle className="text-card-foreground">{editBankItem ? 'עריכת שאלה בבנק' : 'הוספת שאלה חדשה לבנק'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input className="bg-input text-card-foreground border-border" placeholder="תוכן השאלה" value={bankItemForm.text} onChange={e => setBankItemForm({...bankItemForm, text: e.target.value})} />
            
            <Select value={bankItemForm.category} onValueChange={c => setBankItemForm({...bankItemForm, category: c})}>
              <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue placeholder="בחר שלב/קטגוריה" /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                <SelectItem value="admission" className="cursor-pointer">שלב קבלה</SelectItem>
                <SelectItem value="during" className="cursor-pointer">מהלך אשפוז</SelectItem>
                <SelectItem value="discharge" className="cursor-pointer">לקראת שחרור</SelectItem>
                <SelectItem value="after_discharge" className="cursor-pointer">אחרי שחרור</SelectItem>
                <SelectItem value="general" className="cursor-pointer">כללי</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bankItemForm.type} onValueChange={t => setBankItemForm({...bankItemForm, type: t})}>
              <SelectTrigger className="bg-input text-card-foreground border-border cursor-pointer"><SelectValue placeholder="סוג מענה" /></SelectTrigger>
              <SelectContent dir="rtl" className="bg-popover border-border">
                <SelectItem value="emoji" className="cursor-pointer">אימוג'י</SelectItem>
                <SelectItem value="stars" className="cursor-pointer">כוכבים</SelectItem>
                <SelectItem value="choice" className="cursor-pointer">בחירה יחידה</SelectItem>
                <SelectItem value="multi_choice" className="cursor-pointer">בחירה מרובה (רב ברירה)</SelectItem>
                <SelectItem value="open_text" className="cursor-pointer">טקסט חופשי</SelectItem>
              </SelectContent>
            </Select>

            {(bankItemForm.type === 'choice' || bankItemForm.type === 'multi_choice') && (
              <Input className="bg-input text-card-foreground border-border" placeholder="אפשרויות מופרדות בפסיק" value={bankItemForm.options} onChange={e => setBankItemForm({...bankItemForm, options: e.target.value})} />
            )}

            <Button onClick={handleSaveBankItem} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer">שמור פריט בבנק</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
