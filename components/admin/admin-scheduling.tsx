'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit2, Save, X, Clock, Settings, UserPlus } from 'lucide-react'

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  escortPhone: string;
  status: string;
  activeMinutes: number;
  sentMessages?: string[];
}

export function AdminScheduling({ departmentId }: { departmentId: string }) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  
  // ערכים התחלתיים מובנים והגיוניים לפי הסדר
  const [timingSettings, setTimingSettings] = useState({
    admission: { value: '30', unit: 'דקות אחרי', isActive: 'פעיל', recurring: false },
    during: { value: '12', unit: 'שעות אחרי', isActive: 'פעיל', recurring: true },
    discharge: { value: '1', unit: 'שעות לפני', isActive: 'פעיל', recurring: false },
    after_discharge: { value: '24', unit: 'שעות אחרי', isActive: 'פעיל', recurring: false }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<PatientRow>>({});
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
      const patientData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientRow));
      setPatients(patientData.sort((a,b) => a.name.localeCompare(b.name, 'he')));
    });
    
    return () => unsubscribe();
  }, [departmentId]);

  const saveTimingSettings = async () => {
    try {
      await updateDoc(doc(db, 'departments', departmentId), { timingSettings });
      setIsEditingTimings(false);
    } catch (e) { console.error("שגיאה בשמירת התזמונים", e); }
  };

  const handleSavePatient = async () => {
    if (!tempData.id) return;
    try { await updateDoc(doc(db, 'patients', tempData.id), { ...tempData }); setEditingId(null); } catch (e) {}
  };

  const handleAddNewPatient = async () => {
    if (!newPatient.name.trim() || !departmentId) return;
    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient, departmentId, activeMinutes: 0, sentMessages: []
      });
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
      
      {/* תזמוני שליחה */}
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
            className="h-7 text-xs"
          >
            {isEditingTimings ? <><Save className="w-3 h-3 ml-1"/> שמור תזמונים</> : <><Settings className="w-3 h-3 ml-1"/> ערוך תזמונים</>}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map(stage => {
            const setting = timingSettings[stage.id as keyof typeof timingSettings] || { value: '0', unit: 'דקות אחרי', isActive: 'פעיל', recurring: false };
            return (
              <div key={stage.id} className={`border rounded-xl p-3 space-y-3 transition-colors ${setting.isActive === 'פעיל' ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                  {isEditingTimings ? (
                    <Select value={setting.isActive} onValueChange={v => setTimingSettings(prev => ({...prev, [stage.id]: { ...setting, isActive: v }}))}>
                      <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="פעיל" className="text-[10px]">פעיל</SelectItem>
                        <SelectItem value="לא פעיל" className="text-[10px]">לא פעיל</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${setting.isActive === 'פעיל' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {setting.isActive}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>זמן:</span>
                    {isEditingTimings ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <Input type="number" min="0" value={setting.value} onChange={e => setTimingSettings(prev => ({...prev, [stage.id]: { ...setting, value: e.target.value }}))} className="h-8 text-xs w-16 text-center px-1" />
                        <Select value={setting.unit} onValueChange={v => setTimingSettings(prev => ({...prev, [stage.id]: { ...setting, unit: v }}))}>
                          <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent dir="rtl">
                            <SelectItem value="דקות אחרי" className="text-xs">דקות אחרי</SelectItem>
                            <SelectItem value="שעות אחרי" className="text-xs">שעות אחרי</SelectItem>
                            <SelectItem value="שעות לפני" className="text-xs">שעות לפני</SelectItem>
                            <SelectItem value="ימים אחרי" className="text-xs">ימים אחרי</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <strong className="text-primary text-sm">{`${setting.value} ${setting.unit}`}</strong>
                    )}
                  </div>
                  {/* אפשרות לשליחה חוזרת רק במהלך אשפוז */}
                  {stage.id === 'during' && (
                    <div className="flex items-center gap-2 mt-1 bg-blue-50/50 p-1.5 rounded">
                      <input 
                        type="checkbox" 
                        checked={setting.recurring} 
                        disabled={!isEditingTimings}
                        onChange={e => setTimingSettings(prev => ({...prev, [stage.id]: { ...setting, recurring: e.target.checked }}))}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-[10px]">שליחה חוזרת מעל יומיים</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* מעקב מטופלים */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">מעקב מטופלים</h3>
          <Button size="sm" onClick={() => setIsAddPatientOpen(true)} className="h-8 text-xs gap-2">
            <UserPlus className="w-3.5 h-3.5" /> הוסף מטופל
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold text-right">שם מלא</th>
                <th className="px-4 py-3 font-semibold text-right">טלפון מטופל/ת</th>
                <th className="px-4 py-3 font-semibold text-right">טלפון מלווה</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
                <th className="px-4 py-3 font-semibold text-right">זמן בסטטוס</th>
                <th className="px-4 py-3 font-semibold text-center">נשלח (שלבים)</th>
                <th className="px-4 py-3 font-semibold text-center">פעולות עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {patients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">אין כרגע מטופלים פעילים הרשומים.</td></tr>
              ) : patients.map((patient) => {
                const isEditing = editingId === patient.id;
                const displayStatus = STAGES.find(s => s.id === patient.status)?.label || patient.status;

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2"><Input value={tempData.name || ''} onChange={e => setTempData({...tempData, name: e.target.value})} className="h-8 text-xs min-w-[100px]" /></td>
                        <td className="px-4 py-2"><Input value={tempData.phone || ''} onChange={e => setTempData({...tempData, phone: e.target.value})} className="h-8 text-xs min-w-[100px]" dir="ltr" /></td>
                        <td className="px-4 py-2"><Input value={tempData.escortPhone || ''} onChange={e => setTempData({...tempData, escortPhone: e.target.value})} className="h-8 text-xs min-w-[100px]" dir="ltr" /></td>
                        <td className="px-4 py-2">
                          <Select value={tempData.status || ''} onValueChange={val => setTempData({...tempData, status: val})}>
                            <SelectTrigger className="h-8 text-xs min-w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {STAGES.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-slate-400">{formatDuration(patient.activeMinutes)}</td>
                        <td className="px-4 py-2 text-center">-</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" onClick={handleSavePatient} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white px-2"><Save className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 px-2 text-slate-500"><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900 text-right">{patient.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-right" dir="ltr">{patient.phone}</td>
                        <td className="px-4 py-3 text-slate-500 text-right" dir="ltr">{patient.escortPhone || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium text-right">{displayStatus}</td>
                        <td className="px-4 py-3 text-slate-400 text-right">{formatDuration(patient.activeMinutes)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {STAGES.map(stage => {
                              const isSent = patient.sentMessages?.includes(stage.id);
                              const isCurrentStage = patient.status === stage.id;
                              
                              if (isSent) return <span key={stage.id} title={stage.label} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">✓ {stage.label.split(' ')[1]}</span>;
                              if (isCurrentStage) return <span key={stage.id} title={stage.label} className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">בתהליך</span>;
                              return <span key={stage.id} className="text-slate-300">-</span>;
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

      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent dir="rtl" className="bg-white">
          <DialogHeader><DialogTitle>רישום מטופל למעקב מחלקתי</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="שם מלא" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="text-xs h-9" />
            <Input placeholder="טלפון מטופל/ת" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} className="text-xs h-9" dir="ltr" />
            <Input placeholder="טלפון מלווה (אופציונלי)" value={newPatient.escortPhone} onChange={e => setNewPatient({...newPatient, escortPhone: e.target.value})} className="text-xs h-9" dir="ltr" />
            <Select value={newPatient.status} onValueChange={v => setNewPatient({...newPatient, status: v})}>
              <SelectTrigger className="text-xs h-9"><SelectValue placeholder="בחר סטטוס התחלתי" /></SelectTrigger>
              <SelectContent dir="rtl">
                {STAGES.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleAddNewPatient} disabled={!newPatient.name} className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700">שמור מטופל</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
