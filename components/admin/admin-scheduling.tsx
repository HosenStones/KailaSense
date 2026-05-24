'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Save, X, Info } from 'lucide-react'

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  escortPhone: string;
  role: string;
  status: string;
  activeMinutes: number;
  sent: string[];
}

export function AdminScheduling({ departmentId }: { departmentId: string }) {
  // Mock data representing database synchronization for tracking dashboard
  const [patients, setPatients] = useState<PatientRow[]>([
    { id: '1', name: 'ישראל ישראלי', phone: '050-1234567', escortPhone: '', role: 'מטופל', status: 'התקבל', activeMinutes: 45, sent: ['קבלה'] },
    { id: '2', name: 'רונית כהן', phone: '052-7654321', escortPhone: '054-1112222', role: 'מלווה', status: 'באשפוז', activeMinutes: 180, sent: [] },
    { id: '3', name: 'יוסי לוי', phone: '053-9998888', escortPhone: '', role: 'מטופל', status: 'לקראת שחרור', activeMinutes: 4320, sent: ['קבלה', 'מהלך אשפוז'] }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<Partial<PatientRow>>({});

  // Strictly formats active duration into pure minutes, hours, or days
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

  // Instantiates the inline workspace data for the selected row
  const handleEditClick = (p: PatientRow) => {
    setEditingId(p.id);
    setTempData({ ...p });
  };

  // Discards inline changes and clears memory trace
  const handleCancelClick = () => {
    setEditingId(null);
    setTempData({});
  };

  // Synchronizes changes back into the state layout
  const handleSaveClick = () => {
    if (!tempData.id) return;
    setPatients(prev => prev.map(p => p.id === tempData.id ? (tempData as PatientRow) : p));
    setEditingId(null);
    setTempData({});
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Dynamic automated monitoring functional key visual description */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex gap-3 items-start">
        <Info className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <strong className="block text-sm font-bold mb-1">חיווי אוטומציה פעילה (נקודה ירוקה מהבהבת):</strong>
          <p className="text-xs text-emerald-800 leading-relaxed">
            הסימון הירוק המהבהב בשורת המטופל מעיד על כך שמנגנון הניטור האוטומטי פועל כסדרו בזמן אמת. 
            כל עוד הרשומה מסומנת, המערכת תבצע שליחה אוטומטית של הודעות ושאלוני משוב ייעודיים לטלפון הנייד בהתאם לשלב האשפוז והסטטוס המעודכן.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">שם מלא</th>
                <th className="px-4 py-3 font-semibold">מספר טלפון</th>
                <th className="px-4 py-3 font-semibold">טלפון מלווה</th>
                <th className="px-4 py-3 font-semibold">תפקיד</th>
                <th className="px-4 py-3 font-semibold">סטטוס נוכחי</th>
                <th className="px-4 py-3 font-semibold">זמן בסטטוס</th>
                <th className="px-4 py-3 font-semibold text-center">פעולות עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                            value={tempData.role || ''} 
                            onValueChange={val => setTempData(prev => ({ ...prev, role: val }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              <SelectItem value="מטופל">מטופל</SelectItem>
                              <SelectItem value="מלווה">מלווה</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <SelectItem value="התקבל">התקבל</SelectItem>
                              <SelectItem value="באשפוז">באשפוז</SelectItem>
                              <SelectItem value="לקראת שחרור">לקראת שחרור</SelectItem>
                              <SelectItem value="שוחרר">שוחרר</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-slate-400 text-xs">
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
                        <td className="px-4 py-3">
                          <Badge variant={patient.role === 'מטופל' ? 'default' : 'secondary'} className="text-[11px] px-2 py-0">
                            {patient.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{patient.status}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDuration(patient.activeMinutes)}</td>
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
