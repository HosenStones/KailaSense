'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Send, CheckCircle2, User, Phone, Activity } from 'lucide-react'

// נתוני דמה של מטופלים להמחשה של איך זה ייראה כשיחובר ל-API של בית החולים
const MOCK_PATIENTS = [
  { id: '1', name: 'ישראל ישראלי', phone: '050-1234567', status: 'התקבל', timeInStatus: 'שעתיים', sentMessages: ['קבלה'] },
  { id: '2', name: 'שרה כהן', phone: '052-9876543', status: 'מאושפז', timeInStatus: '3 ימים', sentMessages: ['קבלה', 'אשפוז'] },
  { id: '3', name: 'דוד לוי', phone: '054-4567890', status: 'מועמד לשחרור', timeInStatus: '4 שעות', sentMessages: ['קבלה', 'אשפוז', 'לקראת שחרור'] },
  { id: '4', name: 'רחל אברהם', phone: '050-1112233', status: 'שוחרר', timeInStatus: 'יום', sentMessages: ['קבלה', 'אשפוז', 'לקראת שחרור', 'אחרי שחרור'] },
  { id: '5', name: 'משה גולן', phone: '058-9998877', status: 'התקבל', timeInStatus: 'חצי שעה', sentMessages: [] },
]

export function AdminScheduling({ departmentId }: { departmentId: string }) {
  // מצב התזמונים (בפועל יישמר בפיירבייס תחת הגדרות המחלקה)
  const [schedules, setSchedules] = useState({
    admission: { isActive: true, delayHours: 2, triggerStatus: 'התקבל' },
    during: { isActive: true, delayHours: 48, triggerStatus: 'מאושפז' },
    discharge: { isActive: true, delayHours: 0, triggerStatus: 'מועמד לשחרור' },
    after_discharge: { isActive: true, delayHours: 24, triggerStatus: 'שוחרר' },
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSchedules = () => {
    setIsSaving(true)
    // כאן תהיה קריאה לפיירבייס לשמור את ההגדרות
    setTimeout(() => {
      setIsSaving(false)
      alert('הגדרות התזמון נשמרו בהצלחה. המערכת תשלח הודעות וואטסאפ לפי החוקים שהוגדרו.')
    }, 1000)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'התקבל': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">התקבל</Badge>
      case 'מאושפז': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">מאושפז</Badge>
      case 'מועמד לשחרור': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">מועמד לשחרור</Badge>
      case 'שוחרר': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">שוחרר</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in" dir="rtl">
      
      {/* חלק 1: הגדרות תזמון ואוטומציה */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <Clock className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">אוטומציה ותזמוני שליחה לוואטסאפ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* קבלה */}
          <div className="p-4 rounded-xl border border-border bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800">👋 משוב ומידע קבלה</span>
              <Switch 
                checked={schedules.admission.isActive} 
                onCheckedChange={(c) => setSchedules({...schedules, admission: {...schedules.admission, isActive: c}})}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>ישלח</span>
              <Input 
                type="number" 
                className="w-16 h-8 text-center" 
                value={schedules.admission.delayHours}
                onChange={(e) => setSchedules({...schedules, admission: {...schedules.admission, delayHours: Number(e.target.value)}})}
              />
              <span>שעות לאחר שהמטופל מוגדר כ<strong className="text-blue-600">"התקבל"</strong></span>
            </div>
          </div>

          {/* אשפוז */}
          <div className="p-4 rounded-xl border border-border bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800">🛏️ משוב מהלך אשפוז</span>
              <Switch 
                checked={schedules.during.isActive} 
                onCheckedChange={(c) => setSchedules({...schedules, during: {...schedules.during, isActive: c}})}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>ישלח כל</span>
              <Input 
                type="number" 
                className="w-16 h-8 text-center" 
                value={schedules.during.delayHours}
                onChange={(e) => setSchedules({...schedules, during: {...schedules.during, delayHours: Number(e.target.value)}})}
              />
              <span>שעות כל עוד המטופל בסטטוס <strong className="text-purple-600">"מאושפז"</strong></span>
            </div>
          </div>

          {/* לקראת שחרור */}
          <div className="p-4 rounded-xl border border-border bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800">🏠 הנחיות לקראת שחרור</span>
              <Switch 
                checked={schedules.discharge.isActive} 
                onCheckedChange={(c) => setSchedules({...schedules, discharge: {...schedules.discharge, isActive: c}})}
              />
            </div>
            <div className="text-sm text-slate-600 mt-2">
              ישלח מיד (0 שעות) כשהמטופל מוגדר <strong className="text-amber-600">"מועמד לשחרור"</strong> ע"י הרופא.
            </div>
          </div>

          {/* אחרי שחרור */}
          <div className="p-4 rounded-xl border border-border bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800">⏱️ משוב לאחר שחרור</span>
              <Switch 
                checked={schedules.after_discharge.isActive} 
                onCheckedChange={(c) => setSchedules({...schedules, after_discharge: {...schedules.after_discharge, isActive: c}})}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>ישלח</span>
              <Input 
                type="number" 
                className="w-16 h-8 text-center" 
                value={schedules.after_discharge.delayHours}
                onChange={(e) => setSchedules({...schedules, after_discharge: {...schedules.after_discharge, delayHours: Number(e.target.value)}})}
              />
              <span>שעות לאחר שהמטופל מוגדר כ<strong className="text-emerald-600">"שוחרר"</strong></span>
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSchedules} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
            {isSaving ? 'שומר...' : 'שמור חוקי תזמון'}
          </Button>
        </div>
      </div>

      {/* חלק 2: מעקב מטופלים וסטטוס שליחות */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">בקרה ומעקב מטופלים (מקושר למערכת ביה"ח)</h2>
          </div>
          <Badge variant="secondary" className="w-fit bg-emerald-100 text-emerald-800 border-emerald-200">מקוון - מסונכרן</Badge>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-right border-collapse min-w-[800px]">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 text-sm border-b border-border">
                <th className="p-4 font-semibold">שם המטופל</th>
                <th className="p-4 font-semibold">מספר נייד (לוואטסאפ)</th>
                <th className="p-4 font-semibold">סטטוס נוכחי</th>
                <th className="p-4 font-semibold">זמן בסטטוס</th>
                <th className="p-4 font-semibold">הודעות שנשלחו</th>
                <th className="p-4 font-semibold text-left">פעולה יזומה</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PATIENTS.map((patient) => (
                <tr key={patient.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> {patient.name}
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2" dir="ltr">
                      {patient.phone} <Phone className="w-3 h-3 text-slate-400" />
                    </div>
                  </td>
                  <td className="p-4">{renderStatusBadge(patient.status)}</td>
                  <td className="p-4 text-sm text-slate-500">{patient.timeInStatus}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {patient.sentMessages.length > 0 ? (
                        patient.sentMessages.map((msg, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {msg}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">טרם נשלח</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-left">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-8 text-xs font-bold">
                      <Send className="w-3 h-3 ml-1" /> שליחה ידנית
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
