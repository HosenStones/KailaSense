'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Edit2, Save, X, Clock, Settings, CheckCircle2 } from 'lucide-react'

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  escortPhone: string;
  status: string;
  activeMinutes: number;
  sentMessages?: string[];
}

const STAGES = [
  { key: 'admission', label: '👋 קבלה למחלקה' },
  { key: 'during', label: '🛏️ מהלך אשפוז' },
  { key: 'discharge', label: '🏠 לקראת שחרור' },
  { key: 'after_discharge', label: '⏱️ לאחר שחרור' }
];

export function AdminScheduling({ departmentId }: { departmentId: string }) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  const [isSavingTimings, setIsSavingTimings] = useState(false);
  
  const [timingSettings, setTimingSettings] = useState({
    admission: { delay: '30 דק\'', isActive: true },
    during: { delay: '2 שעות', isActive: true },
    discharge: { delay: '0 דק\'', isActive: true },
    after_discharge: { delay: '24 שעות', isActive: true }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<PatientRow>>({});

  useEffect(() => {
    if (!departmentId) return;

    // משיכת הגדרות התזמונים מקולקציית המחלקות
    const fetchTimings = async () => {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      if (deptDoc.exists() && deptDoc.data().timingSettings) {
        setTimingSettings(deptDoc.data().timingSettings);
      }
    };
    fetchTimings();

    // האזנה למטופלים מקולקציית המטופלים בזמן אמת
    const q = query(collection(db, 'patients'), where('departmentId', '==', departmentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientRow));
      setPatients(patientData);
    });
    
    return () => unsubscribe();
  }, [departmentId]);

  const saveTimingSettings = async () => {
    setIsSavingTimings(true);
    try {
      await updateDoc(doc(db, 'departments', departmentId), { timingSettings });
      setIsEditingTimings(false);
    } catch (e) {
      console.error("שגיאה בשמירת התזמונים", e);
    } finally {
      setIsSavingTimings(false);
    }
  };

  const handleSavePatient = async () => {
    if (!tempData.id) return;
    try {
      await updateDoc(doc(db, 'patients', tempData.id), { ...tempData });
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (!minutes) return "0 דק'";
    if (minutes < 60) return `${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} שעות`;
    return `${Math.floor(hours / 24)} ימים`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-800">תזמוני שליחה</h3>
          </div>
          <Button 
            variant={isEditingTimings ? "default" : "outline"} 
            size="sm" 
            onClick={() => isEditingTimings ? saveTimingSettings() : setIsEditingTimings(true)} 
            disabled={isSavingTimings}
            className="h-7 text-xs"
          >
            {isEditingTimings ? <><Save className="w-3 h-3 ml-1"/> שמור תזמונים</> : <><Settings className="w-3 h-3 ml-1"/> ערוך תזמונים</>}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map(stage => {
            const setting = timingSettings[stage.key as keyof typeof timingSettings];
            return (
              <div key={stage.key} className={`border rounded-xl p-3 space-y-2 transition-colors ${setting.isActive ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-70'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700">{stage.label}</span>
                  {isEditingTimings ? (
                    <Switch 
                      checked={setting.isActive} 
                      onCheckedChange={v => setTimingSettings(prev => ({...prev, [stage.key]: { ...setting, isActive: v }}))}
                    />
                  ) : (
                    <span className={`text-[10px] px-1.5 rounded ${setting.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {setting.isActive ? 'פעיל' : 'כבוי'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                  <span>זמן שליחה:</span>
                  {isEditingTimings ? (
                    <Input 
                      value={setting.delay} 
                      onChange={e => setTimingSettings(prev => ({...prev, [stage.key]: { ...setting, delay: e.target.value }}))}
                      className="h-7 text-xs w-16 text-center px-1"
                    />
                  ) : (
                    <strong className="text-primary">{setting.delay}</strong>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <h3 className="text-sm font-bold text-slate-800">מעקב מטופלים</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">שם מלא</th>
                <th className="px-4 py-3 font-semibold">טלפון מטופל/ת</th>
                <th className="px-4 py-3 font-semibold">טלפון מלווה</th>
                <th className="px-4 py-3 font-semibold">סטטוס</th>
                <th className="px-4 py-3 font-semibold">זמן בסטטוס</th>
                <th className="px-4 py-3 font-semibold text-center">נשלח</th>
                <th className="px-4 py-3 font-semibold text-center">פעולות עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {patients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">אין כרגע מטופלים פעילים הרשומים במסד הנתונים למחלקה זו.</td></tr>
              ) : patients.map((patient) => {
                const isEditing = editingId === patient.id;
                // המרת סטטוס מהדאטה בייס לתווית תואמת אם נשמר כקוד (למשל 'admission')
                const displayStatus = STAGES.find(s => s.key === patient.status)?.label || patient.status;

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2"><Input value={tempData.name || ''} onChange={e => setTempData({...tempData, name: e.target.value})} className="h-8 text-xs min-w-[100px]" /></td>
                        <td className="px-4 py-2"><Input value={tempData.phone || ''} onChange={e => setTempData({...tempData, phone: e.target.value})} className="h-8 text-xs min-w-[100px]" dir="ltr" /></td>
                        <td className="px-4 py-2"><Input value={tempData.escortPhone || ''} onChange={e => setTempData({...tempData, escortPhone: e.target.value})} className="h-8 text-xs min-w-[100px]" dir="ltr" /></td>
                        <td className="px-4 py-2">
                          <Select value={tempData.status || ''} onValueChange={val => setTempData({...tempData, status: val})}>
                            <SelectTrigger className="h-8 text-xs min-w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-slate-400">{formatDuration(patient.activeMinutes)}</td>
                        <td className="px-4 py-2 text-center">-</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" onClick={handleSavePatient} className="h-7 bg-emerald-600 px-2"><Save className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 px-2 text-slate-500"><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900">{patient.name}</td>
                        <td className="px-4 py-3 text-slate-600" dir="ltr">{patient.phone}</td>
                        <td className="px-4 py-3 text-slate-500" dir="ltr">{patient.escortPhone || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{displayStatus}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDuration(patient.activeMinutes)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {STAGES.map(stage => {
                              const sent = patient.sentMessages?.includes(stage.key);
                              return (
                                <div key={stage.key} title={stage.label} className={`w-5 h-5 rounded-full flex items-center justify-center ${sent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                  {sent && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => {setEditingId(patient.id); setTempData({...patient});}} className="h-7 px-2 text-slate-400 hover:text-slate-900">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
