'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { Department } from '@/lib/types'

interface SurveyWelcomeProps {
  department: Department
  onStart: () => void
}

export function SurveyWelcome({ department, onStart }: SurveyWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e4faf5] via-white to-[#eeedf9] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/images/kaila-logo-vertical.png"
            alt="Kaila Sense"
            width={100}
            height={100}
            className="h-20 w-auto"
            priority
          />
        </div>

        {/* Welcome Icon */}
        <div className="w-16 h-16 bg-[#e4faf5] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-[#2ecfaa]/20">
          <span role="img" aria-label="heart">💙</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">
          המשוב שלך חשוב לנו
        </h1>
        <p className="text-[#6b6890] leading-relaxed mb-6">
          תודה שבחרת להשתתף.
          <br />
          המשוב שלך עוזר לנו לשפר את השירות לכולם.
        </p>

        {/* Stats */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#e8e7f5]">
            <div className="text-[#3d3a9e] font-bold text-sm">{"<2 דק'"}</div>
            <div className="text-[#a8a6c4] text-xs mt-0.5">זמן מילוי</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#e8e7f5]">
            <div className="text-[#3d3a9e] font-bold text-sm">🔒</div>
            <div className="text-[#a8a6c4] text-xs mt-0.5">אנונימי</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center border border-[#e8e7f5]">
            <div className="text-[#3d3a9e] font-bold text-sm">AI</div>
            <div className="text-[#a8a6c4] text-xs mt-0.5">ניתוח חכם</div>
          </div>
        </div>

        {/* Department Info */}
        <div className="bg-[#eeedf9] rounded-xl p-4 mb-6 border border-[#d4d2f0]">
          <div className="text-[#3d3a9e] font-bold text-sm">{department.name} - שיבא תל השומר</div>
          <div className="text-[#6b68c4] text-xs mt-1">השאלון נשלח אליך אוטומטית לאחר הטיפול</div>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStart}
          className="w-full bg-[#2ecfaa] hover:bg-[#26b896] text-[#1e4a40] font-bold py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {"לחץ/י כאן למשוב 💬"}
        </Button>

        
      </div>
    </div>
  )
}
