'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SurveyThankYouProps {
  departmentName: string
  onClose?: () => void
}

export function SurveyThankYou({ departmentName, onClose }: SurveyThankYouProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-[#2ecfaa] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white">
            <span role="img" aria-label="check">✓</span>
          </div>

          {/* Thank you message */}
          <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">
            תודה רבה! 💙
          </h1>
          <p className="text-[#6b6890] leading-relaxed mb-6">
            המשוב שלך נשמר בהצלחה ויסייע לנו לשפר את השירות לכל המטופלים הבאים.
          </p>

          {/* Impact Card */}
          <div className="bg-[#f7f7fc] rounded-2xl p-4 mb-6 border border-[#e8e7f5]">
            <div className="text-xs text-[#a8a6c4] mb-3">ההשפעה של המשוב שלך החודש</div>
            <div className="flex">
              <div className="flex-1 text-center">
                <div className="text-xl font-bold text-[#3d3a9e]">142</div>
                <div className="text-xs text-[#a8a6c4]">משיבים</div>
              </div>
              <div className="flex-1 text-center border-r border-[#e8e7f5]">
                <div className="text-xl font-bold text-[#3d3a9e]">94%</div>
                <div className="text-xs text-[#a8a6c4]">שביעות</div>
              </div>
              <div className="flex-1 text-center border-r border-[#e8e7f5]">
                <div className="text-xl font-bold text-[#3d3a9e]">+850</div>
                <div className="text-xs text-[#a8a6c4]">תגובות</div>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-[#a8a6c4] leading-relaxed mb-6">
            אנחנו קוראים כל תגובה ומתייחסים.
            <br />
            תודה שעזרת לנו להשתפר
          </p>

          {/* Close Button */}
          <Button
            asChild
            className="w-full bg-[#2ecfaa] hover:bg-[#26b896] text-[#1e4a40] font-bold py-4 rounded-xl"
          >
            <Link href="/">סיום</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
