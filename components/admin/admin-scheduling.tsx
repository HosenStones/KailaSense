'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Save, X, Sliders } from 'lucide-react'

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  escortPhone: string;
  status: string;
  activeMinutes: number;
}

export function AdminScheduling({ departmentId }: { departmentId: string }) {
  const [timingSettings, setTimingSettings] = useState({
    admissionDelay: '30 דק\'', // חצי שעה אחרי הקבלה
    duringInterval: '2 שעות',  // שעתיים אחרי אשפוז כל יום
    dischargeDelay: '24 שעות'  // 24 שעות אחרי שחרור
  });

  const [patients, setPatients] = useState<PatientRow[]>([
    { id: '1', name: 'ישראל ישראלי', phone: '050-1234567', escortPhone: '', status: 'התקבל', activeMinutes: 45 },
    { id: '2', name: 'רונית כהן', phone: '052-7654321', escortPhone: '054-1112222', status: 'באשפוז', activeMinutes: 180 },
    { id: '3', name: 'יוסי לוי', phone: '053-9998888', escortPhone: '', status: 'לקראת שחרור', activeMinutes: 4320 }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<PatientRow>>({});

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} דק'`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} שעות`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ימים`;
  };

  const handleEditClick = (p: PatientRow) => {
    setEditingId(p.id);
    setTempData({ ...p });
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setTempData({});
  };

  const handleSaveClick = () => {
    if (!tempData.id) return;
    setPatients(prev => prev.map(p => p.id === tempData.id ? (tempData as PatientRow) : p));
    setEditingId(null);
    setTempData({});
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Configuration layout panel for automation schedules */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-800">הגדרות תזמוני אוטומציה מחלקתיים</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">שלב קבלה והתמצאות</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">פעיל</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>שליחה אוטומטית כעבור:</span>
              <Input 
                type="text" 
                value={timingSettings.admissionDelay} 
                onChange={e => setTimingSettings({...timingSettings, admissionDelay: e.target.value})}
                className="h-7 w-20 text-center text-xs bg-white font-medium" 
              />
            </div>
          </div>
          
          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">מהלך אשפוז שוטף</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">פעיל</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>שליחה חוזרת כל פעימה של:</span>
              <Input 
                type="text" 
                value={timingSettings.duringInterval} 
                onChange={e => setTimingSettings({...timingSettings, duringInterval: e.target.value})}
                className="h-7 w-20 text-center text-xs bg-white font-medium" 
              />
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">לאחר השחרור מהמחלקה</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">פעיל</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>שליחה סופית כעבור:</span>
              <Input 
                type="text" 
                value={timingSettings.dischargeDelay} 
                onChange={e => setTimingSettings({...timingSettings, dischargeDelay: e.target.value})}
                className="h-7 w-20 text-center text-xs bg-white font-medium" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">שם מלא</th>
                <th className="px-4 py-3 font-semibold">טלפון מטופל/ת</th>
                <th className="px-4 py-3 font-semibold">טלפון מלווה</th>
                <th className="px-4 py-3 font-semibold">סטטוס נוכחי</th>
                <th className="px-4 py-3 font-semibold">זמן בסטטוס</th>
                <th className="px-4 py-3 font-semibold text-center">פעולות עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {patients.map((patient) => {
                const isEditing = editingId === patient.id;
                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <Input 
                            value={tempData.name || ''} 
                            onChange={e => setTempData(prev => ({ ...prev, name: e.target.value }))}
                            className="h-9 text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            value={tempData.phone || ''} 
                            onChange={e => setTempData(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-9 text-xs text-left"
                            dir="ltr"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            value={tempData.escortPhone || ''} 
                            onChange={e => setTempData(prev => ({ ...prev, escortPhone: e.target.value }))}
                            className="h-9 text-xs text-left"
                            dir="ltr"
                            placeholder="אין מלווה רשום"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Select 
                            value={tempData.status || ''} 
                            onValueChange={val => setTempData(prev => ({ ...prev, status: val }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="באשפוז">באשפוז</SelectItem>
                              <SelectItem value="התקבל">התקבל</SelectItem>
                              <SelectItem value="לקראת שחרור">לקראת שחרור</SelectItem>
                              <SelectItem value="שוחרר">שוחרר</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-slate-400">
                          {formatDuration(patient.activeMinutes)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              size="sm" 
                              onClick={handleSaveClick} 
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelClick} 
                              className="h-8 px-2.5 text-slate-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {patient.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{patient.phone}</td>
                        <td className="px-4 py-3 text-slate-500">{patient.escortPhone || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{patient.status}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDuration(patient.activeMinutes)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditClick(patient)} 
                            className="h-8 px-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          >
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
