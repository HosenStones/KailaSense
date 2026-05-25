'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit2, Save, X, Clock, Settings, UserPlus, Activity, Plus, Trash2 } from 'lucide-react'

interface AdminSchedulingProps {
  departmentId: string;
  isReadOnly?: boolean;
}

const DEFAULT_TIMINGS = {
  admission: { value: '30', unit: 'דקות אחרי', isActive: 'פעיל', label: '👋 קבלה למחלקה' },
  during: { value: '12', unit: 'שעות אחרי', isActive: 'פעיל', label: '🛏️ מהלך אשפוז' },
  discharge: { value: '1', unit: 'שעות לפני', isActive: 'פעיל', label: '🏠 לקראת שחרור' },
  after_discharge: { value: '24', unit: 'שעות אחרי', isActive: 'פעיל', label: '⏱️ לאחר שחרור' }
};

export function AdminScheduling({ departmentId, isReadOnly = false }: AdminSchedulingProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  const [timingSettings, setTimingSettings] = useState<any>(DEFAULT_TIMINGS);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', escortPhone: '', status: 'admission' });
  
  useEffect(() => {
    if (!departmentId) return;

    const fetchTimings = async () => {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      const dbTimings = deptDoc.exists() ? (deptDoc.data().timingSettings || {}) : {};
      
      const merged: any = { ...dbTimings };
      // הבטחה שתוויות ברירת המחדל לא יידרסו ושלא יהיה undefined
      Object.keys(DEFAULT_TIMINGS).forEach(key => {
        if (merged[key]) {
          merged[key].label = DEFAULT_TIMINGS[key as keyof typeof DEFAULT_TIMINGS].label;
        } else {
          merged[key] = { ...DEFAULT_TIMINGS[key as keyof typeof DEFAULT_TIMINGS] };
        }
      });
      setTimingSettings(merged);
    };
    fetchTimings();

    const q = query(collection(db, 'patients'), where('departmentId', '==', departmentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(patientData.sort((a,b) => a.name.localeCompare(b.name, 'he')));
    });
    return () => unsubscribe();
  }, [departmentId]);

  const saveTimingSettings = async () => {
    try {
      await updateDoc(doc(db, 'departments', departmentId), { timingSettings });
      setIsEditingTimings(false);
    } catch (e) {}
  };

  const STAGES = CATEGORIES.filter(c => c.id !== 'general');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e8e7f5] pb-4 gap-3">
          <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2a7c7c]" /> תזמוני שליחה
          </h3>
          <Button variant={isEditingTimings ? "default" : "outline"} size="sm" onClick={() => isEditingTimings ? saveTimingSettings() : setIsEditingTimings(true)} className="h-9 text-xs">
            {isEditingTimings ? 'שמור תזמונים' : 'ערוך תזמונים'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(timingSettings).map(key => {
            const setting = timingSettings[key];
            return (
              <div key={key} className="border rounded-xl p-4 bg-[#f7f7fc] border-[#e8e7f5]">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-[#1e1c4a]">{setting.label}</span>
                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${setting.isActive === 'פעיל' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{setting.isActive}</span>
                </div>
                <strong className="text-[#1e1c4a] text-sm">{`${setting.value} ${setting.unit}`}</strong>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e7f5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e8e7f5] bg-[#f7f7fc] flex justify-between items-center">
          <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2a7c7c]" /> מעקב מטופלים
          </h3>
          <Button onClick={() => setIsAddPatientOpen(true)} className="h-9 text-xs bg-[#2a7c7c] text-white">הוסף מטופל</Button>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full text-sm text-right min-w-[750px]">
            <thead className="text-slate-500 text-xs">
              <tr>
                <th className="px-4 py-3">שם מלא</th>
                <th className="px-4 py-3">סטטוס</th>
                <th className="px-4 py-3 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t">
                  <td className="px-4 py-3">{patient.name}</td>
                  <td className="px-4 py-3">{patient.status}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc(db, 'patients', patient.id))}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
