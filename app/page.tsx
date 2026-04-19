'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAllDepartments } from '@/lib/firebase/firestore'
import type { Department } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Fetch departments and sort alphabetically
    async function fetchDepts() {
      try {
        const depts = await getAllDepartments()
        const sorted = [...depts].sort((a, b) => a.name.localeCompare(b.name, 'he'))
        setDepartments(sorted)
      } catch (error) {
        console.error("Failed to fetch departments", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDepts()
  }, [])

  const handleStartSurvey = () => {
    if (selectedDept) {
      router.push(`/survey/${selectedDept}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-[#2ecfaa] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[#6b6890] font-bold">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e8e7f5] p-8 text-center">
        
        {/* Vertical Logo as requested */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/images/kaila-logo-vertical.png" 
            alt="KailaSense" 
            width={120} 
            height={80} 
            className="h-20 w-auto"
            priority
          />
        </div>
        
        <h1 className="text-2xl font-bold text-[#1e1c4a] mb-2">ברוכים הבאים</h1>
        <p className="text-[#6b6890] mb-8 text-sm">באיזו מחלקה ביקרת?</p>

        <div className="space-y-6">
          {departments.length === 0 ? (
            <div className="text-[#a8a6c4] p-4 bg-[#f7f7fc] rounded-xl border border-dashed border-[#e8e7f5] text-sm">
              לא נמצאו מחלקות פעילות.
            </div>
          ) : (
            <>
              <Select onValueChange={setSelectedDept}>
                <SelectTrigger className="w-full h-14 text-right bg-[#f7f7fc] border-[#e8e7f5] rounded-xl text-[#1e1c4a] font-medium" dir="rtl">
                  <SelectValue placeholder="בחרי מחלקה מהרשימה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id} className="text-right">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleStartSurvey}
                disabled={!selectedDept}
                className="w-full h-14 bg-[#2a7c7c] hover:bg-[#236969] text-white rounded-xl font-bold text-lg transition-all"
              >
                התחל סקר
              </Button>
            </>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-[#e8e7f5]">
          <Link href="/admin/login" className="text-sm text-[#a8a6c4] hover:text-[#2a7c7c] transition-colors">
            כניסת צוות ניהול
          </Link>
        </div>
      </div>
    </div>
  )
}
