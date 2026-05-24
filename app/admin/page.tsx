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

// Dashboard tabs definition
type TabId = 'insights' | 'questions' | 'comments' | 'scheduling' | 'settings' | 'system' | 'bank'

const INITIAL_BANK_QUESTIONS = [
  { text: "How did you feel upon admission?", type: "emoji", category: "admission", tag: "כללי" },
  { text: "Was the admission process clear?", type: "choice", category: "admission", tag: "כללי", options: ["Yes, everything was clear", "Partially", "No, information was missing"] },
  { text: "How would you rate the nursing staff?", type: "stars", category: "during", tag: "כללי" },
  { text: "Which services helped you the most?", type: "multi_choice", category: "during", tag: "כללי", options: ["Dietitian", "Social Worker", "Physiotherapy", "Pharmacy consult", "Nursing instruction"] },
  { text: "What was missing in your room?", type: "multi_choice", category: "during", tag: "כללי", options: ["Extra blanket", "Pillows", "Towels", "Soap/Shampoo", "Drinking water", "Cleaning"] },
  { text: "Who provided the most significant care?", type: "multi_choice", category: "during", tag: "כללי", options: ["Nurse", "Doctor", "Aide", "Cleaning staff"] },
  { text: "Do you feel ready for discharge?", type: "emoji", category: "discharge", tag: "כללי" },
  { text: "What additional info do you need for discharge?", type: "multi_choice", category: "discharge", tag: "כללי", options: ["Medication", "Diet", "Activity", "Follow-up", "Emergency contact"] },
  { text: "Overall experience?", type: "stars", category: "general", tag: "כללי" }
];

export default function AdminDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [globalBank, setGlobalBank] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('insights')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [isBankItemOpen, setIsBankItemOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [bankItemForm, setBankItemForm] = useState({ text: '', type: 'emoji', category: 'general', options: '', tag: 'כללי' })

  const loadData = async (email: string) => {
    try {
      const adminData = await getAdminUserByEmail(email);
      if (!adminData) { setStatus('error'); return; }
      setCurrentUser(adminData);
      const allDepts = await getAllDepartments();
      setDepartments(allDepts);
      if (adminData.role === 'super_admin') {
        const bankData = await getGlobalQuestions();
        setGlobalBank(bankData);
      }
      if (adminData.departmentId) setSelectedDepartment(adminData.departmentId);
      else if (allDepts.length > 0) setSelectedDepartment(allDepts[0].id);
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

  return (
    <div className="min-h-screen bg-transparent" dir="rtl">
      <AdminHeader user={currentUser} title="Dashboard" onProfileClick={() => setActiveTab('settings')} />
      
      <div className="bg-white border-b border-border px-4 md:px-6 flex flex-col md:flex-row md:justify-between items-start md:items-center min-h-[56px] gap-2 pt-2">
        <nav className="flex gap-1 h-14 overflow-x-auto whitespace-nowrap hide-scrollbar w-full md:w-auto">
          {[
            { id: 'insights', label: 'Insights', icon: '📊' },
            { id: 'comments', label: 'Comments', icon: '💬' },
            { id: 'questions', label: 'Questions', icon: '📋' },
            { id: 'scheduling', label: 'Scheduling', icon: '⏱️' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            ...(currentUser?.role === 'super_admin' ? [{ id: 'system', label: 'System', icon: '🛡️' }, { id: 'bank', label: 'Bank', icon: '📚' }] : [])
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

     <main className="p-4 md:p-6 max-w-6xl mx-auto">
        {activeTab === 'insights' && <AdminInsights departmentId={selectedDepartment} />}
        {activeTab === 'questions' && <AdminQuestions departmentId={selectedDepartment} />}
        {activeTab === 'comments' && <AdminComments departmentId={selectedDepartment} />}
        {activeTab === 'scheduling' && <AdminScheduling departmentId={selectedDepartment} />}
        {activeTab === 'settings' && <AdminSettings departmentId={selectedDepartment} />}
     </main>
    </div>
  )
}
