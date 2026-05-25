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
  
  const [now, setNow] = useState(Date.now());
  useEffect(() => { 
    const timer = setInterval(() => setNow(Date.now()), 60000); 
    return () => clearInterval(timer); 
  }, []);

  useEffect(() => {
    if (!departmentId) return;

    const fetchTimings = async () => {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      const dbTimings = deptDoc.exists() ? (deptDoc.data().timingSettings || {}) : {};
      
      const merged: any = { ...dbTimings };
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
    try { 
      await updateDoc(doc(db, 'patients', tempData.id), { 
        name: tempData.name,
        phone: tempData.phone,
        escortPhone: tempData.escortPhone,
        status: tempData.status
      }); 
      setEditingId(null); 
    } catch (e) {}
  };

  const handleDeletePatient = async (id: string) => {
    if(!confirm('האם למחוק מטופל זה מהמעקב?')) return;
    try { await deleteDoc(doc(db, 'patients', id)); } catch(e){}
  };

  const handleAddNewPatient = async () => {
    if (!newPatient.name.trim() || !departmentId) return;
    try {
      await addDoc(collection(db, 'patients'), { 
        ...newPatient, 
        departmentId, 
        activeMinutes: 0, 
        sentMessages: [],
        createdAt: new Date().toISOString()
      });
      setIsAddPatientOpen(false);
      setNewPatient({ name: '', phone: '', escortPhone: '', status: 'admission' });
    } catch (e) {}
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 0 || !minutes) return "0 דקות";
    if (minutes < 60) return `${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} שעות`;
    return `${Math.floor(hours / 24)} ימים`;
  };

  const getRequiredMinutesForStatus = (statusId: string) => {
    const setting = timingSettings[statusId];
    if (!setting || setting.isActive !== 'פעיל') return Infinity;
    let val = parseInt(setting.value) || 0;
    if (setting.unit.includes('שעות')) val *= 60;
    if (setting.unit.includes('ימים')) val *= 1440;
    return val;
  };

  const STAGES = CATEGORIES.filter(c => c.id !== 'general');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white border border-[#e8e7f5] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e8e7f5] pb-4 gap-3">
          <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2a7c7c]" /> תזמוני שליחה
          </h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(timingSettings).map(key => {
            const setting = timingSettings[key];
            return (
              <div key={key} className={`border rounded-xl p-4 space-y-3 transition-colors ${setting.isActive === 'פעיל' ? 'bg-[#f7f7fc] border-[#e8e7f5]' : 'bg-white border-slate-200'}`}>
                
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {isEditingTimings && setting.isCustom && !isReadOnly && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomTiming(key)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5"/></Button>
                    )}
                    {isEditingTimings && setting.isCustom && !isReadOnly ? (
                      <Input value={setting.label} onChange={e => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, label: e.target.value }}))} className="h-7 text-xs w-full bg-white border-[#e8e7f5]" />
                    ) : (
                      <span className="text-xs font-bold text-[#1e1c4a] truncate" title={setting.label}>{setting.label}</span>
                    )}
                  </div>

                  {isEditingTimings && !isReadOnly ? (
                    <Select value={setting.isActive} onValueChange={v => setTimingSettings((prev:any) => ({...prev, [key]: { ...setting, isActive: v }}))}>
                      <SelectTrigger className="h-7 w-20 text-[10px] bg-white border-[#e8e7f5] shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl"><SelectItem value="פעיל" className="text-[10px]">פעיל</SelectItem><SelectItem value="לא פעיל" className="text-[10px]">לא פעיל</SelectItem></SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border shrink-0 ${setting.isActive === 'פעיל' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{setting.isActive}</span>
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
                    <strong className="text-[#1e1c4a] text-sm">{`${setting.value} ${setting.unit}`}</strong>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e7f5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e8e7f5] bg-[#f7f7fc] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-[#1e1c4a] text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2a7c7c]" /> מעקב מטופלים
          </h3>
          {!isReadOnly && (
            <Button onClick={() => setIsAddPatientOpen(true)} className="h-9 text-xs gap-2 bg-[#2a7c7c] hover:bg-[#206060] text-white">
              <UserPlus className="w-4 h-4" /> הוסף מטופל
            </Button>
          )}
        </div>
        <div className="overflow-x-auto bg-white p-2">
          <table className="w-full text-sm text-right min-w-[750px]">
            <thead className="border-b border-[#e8e7f5] text-slate-500 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold text-right">שם מלא</th>
                <th className="px-4 py-3 font-semibold text-right">טלפון מטופל/ת</th>
                <th className="px-4 py-3 font-semibold text-right">טלפון מלווה</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
                <th className="px-4 py-3 font-semibold text-right">זמן בסטטוס</th>
                <th className="px-4 py-3 font-semibold text-center w-40">שליחת הודעה</th>
                {!isReadOnly && <th className="px-4 py-3 font-semibold text-center w-20">פעולות</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e7f5] text-xs">
              {patients.length === 0 ? (
                <tr><td colSpan={isReadOnly ? 6 : 7} className="text-center py-12 text-slate-400">אין כרגע מטופלים פעילים.</td></tr>
              ) : patients.map((patient) => {
                const isEditing = editingId === patient.id;
                const displayStatus = STAGES.find(s => s.id === patient.status)?.label || patient.status;
                const liveActiveMinutes = patient.createdAt ? Math.floor((now - new Date(patient.createdAt).getTime()) / 60000) : patient.activeMinutes;

                return (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    {isEditing && !isReadOnly ? (
                      <>
                        <td className="px-4 py-2"><Input value={tempData.name || ''} onChange={e => setTempData({...tempData, name: e.target.value})} className="h-8 text-xs min-w-[100px] bg-white border-[#e8e7f5]" /></td>
                        <td className="px-4 py-2"><Input value={tempData.phone || ''} onChange={e => setTempData({...tempData, phone: e.target.value})} className="h-8 text-xs min-w-[100px] bg-white border-[#e8e7f5]" dir="ltr" /></td>
                        <td className="px-4 py-2"><Input value={tempData.escortPhone || ''} onChange={e => setTempData({...tempData, escortPhone: e.target.value})} className="h-8 text-xs min-w-[100px] bg-white border-[#e8e7f5]" dir="ltr" /></td>
                        <td className="px-4 py-2">
                          <Select value={tempData.status || ''} onValueChange={val => setTempData({...tempData, status: val})}>
                            <SelectTrigger className="h-8 text-xs min-w-[140px] bg-white border-[#e8e7f5]"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">{STAGES.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px]">{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-slate-400">{formatDuration(liveActiveMinutes)}</td>
                        <td className="px-4 py-2 text-center">-</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" onClick={handleSavePatient} className="h-7 w-7 p-0 bg-[#2a7c7c] text-white"><Save className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 w-7 p-0 bg-white"><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-[#1e1c4a] text-right">{patient.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-right" dir="ltr">{patient.phone}</td>
                        <td className="px-4 py-3 text-slate-500 text-right" dir="ltr">{patient.escortPhone || '-'}</td>
                        <td className="px-4 py-3 text-[#1e1c4a] font-medium text-right">{displayStatus}</td>
                        <td className="px-4 py-3 text-slate-500 text-right">{formatDuration(liveActiveMinutes)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap w-full">
                            {STAGES.map(stage => {
                              const isCurrentStage = patient.status === stage.id;
                              const requiredMins = getRequiredMinutesForStatus(stage.id);
                              const isAutoSent = isCurrentStage && liveActiveMinutes >= requiredMins;
                              const isSent = patient.sentMessages?.includes(stage.id) || isAutoSent;

                              if (isSent) return <span key={stage.id} title={stage.label} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">✓ {stage.label.split(' ')[1]}</span>;
                              if (isCurrentStage && !isAutoSent) return <span key={stage.id} title={stage.label} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">בתהליך</span>;
                              return <span key={stage.id} className="text-slate-300">-</span>;
                            })}
                          </div>
                        </td>
                        {!isReadOnly && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => {setEditingId(patient.id); setTempData({...patient});}} className="h-7 w-7 p-0 text-slate-400 hover:text-[#2a7c7c]"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeletePatient(patient.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isReadOnly && (
        <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
          <DialogContent dir="rtl" className="bg-white w-[95vw] md:max-w-md">
            <DialogHeader><DialogTitle className="text-[#1e1c4a]">רישום מטופל למעקב</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="שם מלא" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="text-xs h-10 bg-white border-[#e8e7f5]" />
              <Input placeholder="טלפון מטופל/ת" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="text-xs h-10 bg-white border-[#e8e7f5]" dir="ltr" />
              <Input placeholder="טלפון מלווה" value={newPatient.escortPhone} onChange={e => setNewPatient({...newPatient, escortPhone: e.target.value})} className="text-xs h-10 bg-white border-[#e8e7f5]" dir="ltr" />
              <Select value={newPatient.status} onValueChange={v => setNewPatient({...newPatient, status: v})}>
                <SelectTrigger className="text-xs h-10 bg-white border-[#e8e7f5]"><SelectValue placeholder="בחר סטטוס התחלתי" /></SelectTrigger>
                <SelectContent dir="rtl">{STAGES.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleAddNewPatient} disabled={!newPatient.name} className="w-full text-xs h-10 bg-[#2a7c7c] hover:bg-[#206060] text-white font-bold">שמור מטופל</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
