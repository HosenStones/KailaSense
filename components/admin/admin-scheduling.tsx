'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit2, Save, X, Clock, Settings, UserPlus, Activity, CheckCircle2, Plus, Trash2 } from 'lucide-react'

interface AdminSchedulingProps {
  departmentId: string;
  isReadOnly?: boolean;
}

export function AdminScheduling({ departmentId, isReadOnly = false }: AdminSchedulingProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  
  // Custom expandable timings object for the department
  const [timingSettings, setTimingSettings] = useState<any>({
    admission: { value: '30', unit: 'דקות אחרי', isActive: 'פעיל', label: '👋 קבלה למחלקה' },
    during: { value: '12', unit: 'שעות אחרי', isActive: 'פעיל', label: '🛏️ מהלך אשפוז' },
    discharge: { value: '1', unit: 'שעות לפני', isActive: 'פעיל', label: '🏠 לקראת שחרור' },
    after_discharge: { value: '24', unit: 'שעות אחרי', isActive: 'פעיל', label: '⏱️ לאחר שחרור' }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', escortPhone: '', status: 'admission' });

  useEffect(() => {
    if (!departmentId) return;

    const fetchTimings = async () => {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      if (deptDoc.exists() && deptDoc.data().timingSettings) {
        setTimingSettings(deptDoc.data().timingSettings);
      }
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

  const handleAddCustomTiming = () => {
    const customId = `custom_${Date.now()}`;
    setTimingSettings((prev: any) => ({
      ...prev,
      [customId]: { value: '2', unit: 'ימים אחרי', isActive: 'פעיל', label: '⚡ תזמון מותאם אישית', isCustom: true }
    }));
  };

  const handleRemoveCustomTiming = (id: string) => {
    const updated = { ...timingSettings };
    delete updated[id];
    setTimingSettings(updated);
  };

  const handleSavePatient = async () => {
    if (!tempData.id) return;
    try { await updateDoc(doc(db, 'patients', tempData.id), { ...tempData }); setEditingId(null); } catch (e) {}
  };

  const handleAddNewPatient = async () => {
    if (!newPatient.name.trim() || !departmentId) return;
    try {
      await addDoc(collection(db, 'patients'), { ...newPatient, departmentId, activeMinutes: 0, sentMessages: [] });
      setIsAddPatientOpen(false);
      setNewPatient({ name: '', phone: '', escortPhone: '', status: 'admission' });
    } catch (e) {}
  };

  const formatDuration = (minutes: number): string => {
    if (!minutes) return "0 דקות";
    if (minutes < 60) return `${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} שעות`;
    return `${Math.floor(hours / 24)} ימים`;
  };

  const STAGES = CATEGORIES.filter(c => c.id !== 'general');

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Timings Block */}
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e8e7f5] pb-4 gap-3">
          <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2a7c7c]" /> תזמוני שליחה
          </h3>
          {/* מוסתר למשתמשי צוות */}
          {!isReadOnly && (
            <div className="flex gap-2">
               {isEditingTimings && (
                 <Button variant="outline" size="sm" onClick={handleAddCustomTiming} className="h-9 text-xs border-[#e8e7f5] text-slate-700 bg-white">
                   <Plus className="w-3.5 h-3.5 ml-1"/> הוסף תזמון מותאם
                 </Button>
               )}
               <Button variant={isEditingTimings ? "default" : "outline"} size="sm" onClick={() => isEditingTimings ? saveTimingSettings() : setIsEditingTimings(true)} className={`h-9 text-xs ${isEditingTimings ? 'bg-[#2a7c7c] text-white hover:bg-[#206060]' : 'border-[#e8e7f5] bg-white text-slate-700'}`}>
                 {isEditingTimings ? <><Save className="w-3.5 h-3.5 ml-1"/> שמור תזמונים</> : <><Settings className="w-3.5 h-3.5 ml-1"/> ערוך תזמונים</>}
               </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(timingSettings).map(key => {
            const setting = timingSettings[key];
            return (
              <div key={key} className={`border rounded-xl p-4 space-y-3 transition-colors ${setting.isActive === 'פעיל' ? 'bg-[#f7f7fc] border-[#e8e7f5]' : 'bg-slate-50/50 border-slate-100 opacity-60 relative'}`}>
                {isEditingTimings && setting.isCustom && !isReadOnly && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomTiming(key)} className="absolute top-2 left-2 h-6 w-6 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></Button>
                )}
                
                <div className="flex justify-between items-center">
                  {isEditingTimings && setting.isCustom && !isReadOnly ? (
                    <Input value={setting.label} onChange={e => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, label: e.target.value }}))} className="h-7 text-xs w-32 bg-white border-[#e8e7f5]" />
                  ) : (
                    <span className="text-xs font-bold text-[#1e1c4a]">{setting.label}</span>
                  )}

                  {isEditingTimings && !isReadOnly ? (
                    <Select value={setting.isActive} onValueChange={v => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, isActive: v }}))}>
                      <SelectTrigger className="h-7 w-20 text-[10px] bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl"><SelectItem value="פעיל" className="text-[10px]">פעיל</SelectItem><SelectItem value="לא פעיל" className="text-[10px]">לא פעיל</SelectItem></SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${setting.isActive === 'פעיל' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{setting.isActive}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                  <span>זמן:</span>
                  {isEditingTimings && !isReadOnly ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input type="number" min="0" value={setting.value} onChange={e => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, value: e.target.value }}))} className="h-8 text-xs w-16 text-center bg-white border-[#e8e7f5]" />
                      <Select value={setting.unit} onValueChange={v => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, unit: v }}))}>
                        <SelectTrigger className="h-8 flex-1 text-xs bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="דקות אחרי" className="text-xs">דקות אחרי</SelectItem>
                          <SelectItem value="שעות אחרי" className="text-xs">שעות אחרי</SelectItem>
                          <SelectItem value="שעות לפני" className="text-xs">שעות לפני</SelectItem>
                          <SelectItem value="ימים אחרי" className="text-xs">ימים אחרי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <strong className="text-[#1e1c4
