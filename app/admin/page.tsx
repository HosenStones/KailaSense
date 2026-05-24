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
// Updated import path
import { AdminScheduling } from '@/components/admin/admin-scheduling'
import { AdminHeader } from '@/components/admin/admin-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Pencil } from 'lucide-react'

type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

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

  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isBankItemOpen, setIsBankItemOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editBankItem, setEditBankItem] = useState<any | null>(null)
  
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
               {/* ... Bank management content ... */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
