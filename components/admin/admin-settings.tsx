'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AdminSettingsProps {
  departmentId: string
}

export function AdminSettings({ departmentId }: AdminSettingsProps) {
  const [departmentName, setDepartmentName] = useState('מחלקת קרדיולוגיה')
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Department Settings */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e7f5]">
        <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">הגדרות מחלקה</h3>
        
        {/* Logo Upload */}
        <div className="border-2 border-dashed border-[#e8e7f5] rounded-xl p-5 text-center cursor-pointer mb-4 hover:border-[#2ecfaa] hover:bg-[#e4faf5] transition-colors">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-xs text-[#a8a6c4]">לחץ להעלאת לוגו מחלקה</div>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-[#a8a6c4] font-semibold mb-1 uppercase tracking-wide">שם המחלקה</label>
          <Input
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="w-full px-3 py-2 border-[#e8e7f5] rounded-lg text-sm focus:border-[#2ecfaa]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-[#a8a6c4] font-semibold mb-1 uppercase tracking-wide">מנהל המחלקה</label>
          <Input
            value="ד״ר שרה לוי"
            className="w-full px-3 py-2 border-[#e8e7f5] rounded-lg text-sm focus:border-[#2ecfaa]"
            readOnly
          />
        </div>

        <Button className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold py-3 rounded-xl">
          שמור שינויים
        </Button>
      </div>

      {/* Integration Settings */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e7f5]">
        <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">אינטגרציות</h3>
        
        {whatsappEnabled && (
          <div className="bg-[#e4faf5] rounded-xl p-3 mb-4 flex items-center gap-2 border border-[#b8eedd]">
            <span className="text-lg">✓</span>
            <span className="text-sm font-semibold text-[#0a5c4a]">WhatsApp מחובר</span>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs text-[#a8a6c4] font-semibold mb-1 uppercase tracking-wide">מספר WhatsApp</label>
          <Input
            value="+972-50-1234567"
            className="w-full px-3 py-2 border-[#e8e7f5] rounded-lg text-sm focus:border-[#2ecfaa]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-[#a8a6c4] font-semibold mb-1 uppercase tracking-wide">תבנית הודעה</label>
          <select className="w-full px-3 py-2 border border-[#e8e7f5] rounded-lg text-sm text-[#1e1c4a] bg-white outline-none focus:border-[#2ecfaa]">
            <option>תבנית ברירת מחדל</option>
            <option>תבנית מקוצרת</option>
            <option>תבנית מורחבת</option>
          </select>
        </div>

        <Button className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold py-3 rounded-xl">
          שמור הגדרות
        </Button>
      </div>

      {/* User Management */}
      <div className="col-span-2 bg-white rounded-2xl p-5 border border-[#e8e7f5]">
        <h3 className="text-sm font-bold text-[#1e1c4a] mb-4">ניהול משתמשים</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] bg-[#f7f7fc] rounded-xl p-4 border border-[#e8e7f5]">
            <p className="text-sm font-bold text-[#1e1c4a] mb-1">ד״ר שרה לוי</p>
            <p className="text-xs text-[#a8a6c4] mb-2">מנהלת מחלקה</p>
            <button className="text-xs text-[#2a7c7c] font-semibold hover:underline">ערוך</button>
          </div>
          <div className="flex-1 min-w-[180px] bg-[#f7f7fc] rounded-xl p-4 border border-[#e8e7f5]">
            <p className="text-sm font-bold text-[#1e1c4a] mb-1">רחל כהן</p>
            <p className="text-xs text-[#a8a6c4] mb-2">אחות אחראית</p>
            <button className="text-xs text-[#2a7c7c] font-semibold hover:underline">ערוך</button>
          </div>
          <div className="flex-1 min-w-[180px] border-2 border-dashed border-[#e8e7f5] rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-[#e4faf5] hover:border-[#2ecfaa] transition-colors">
            <span className="text-sm text-[#a8a6c4] font-semibold">+ הוסף משתמש</span>
          </div>
        </div>
      </div>
    </div>
  )
}
