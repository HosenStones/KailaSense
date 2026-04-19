'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getAllDepartments } from '@/lib/firebase/firestore'
import type { Department } from '@/lib/types'

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDepts() {
      try {
        const depts = await getAllDepartments()
        setDepartments(depts)
      } catch (error) {
        console.error("Failed to fetch departments", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDepts()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center" dir="rtl">
        <div className="text-[#6b6890]">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e8e7f5] p-8 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/images/kaila-logo-vertical.png" 
            alt="KailaSense" 
            width={120} 
            height={80} 
            className="h-16 w-auto"
            priority
          />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">ברוכים הבאים</h1>
        <p className="text-[#6b6890] mb-8 text-sm">אנא בחרו את המחלקה עבורה תרצו למלא סקר שביעות רצון:</p>

        {/* Dynamic department list from database */}
        <div className="space-y-3">
          {departments.length === 0 ? (
            <div className="text-[#a8a6c4] p-4 bg-[#f7f7fc] rounded-xl border border-dashed border-[#e8e7f5] text-sm">
              לא נמצאו מחלקות. יש להוסיף מחלקות דרך ממשק המנהל.
            </div>
          ) : (
            departments.map(dept => (
              <Link 
                key={dept.id} 
                href={`/survey/${dept.id}`}
                className="block w-full p-4 text-center bg-[#f7f7fc] hover:bg-[#e4faf5] border border-[#e8e7f5] hover:border-[#2ecfaa] rounded-xl text-[#1e1c4a] font-semibold transition-all shadow-sm hover:shadow"
              >
                {dept.name}
              </Link>
            ))
          )}
        </div>

        {/* Admin login button */}
        <div className="mt-12 pt-6 border-t border-[#e8e7f5]">
          <Link href="/admin/login" className="text-sm text-[#a8a6c4] hover:text-[#2a7c7c] transition-colors">
            כניסת מנהלים
          </Link>
        </div>
      </div>
    </div>
  )
}
