'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link' // Fixed missing import
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">טוען...</div>

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        <Image src="/images/kaila-logo-vertical.png" alt="KailaSense" width={120} height={80} className="mx-auto mb-8" priority />
        <h1 className="text-2xl font-bold mb-8">באיזו מחלקה ביקרת?</h1>

        <Select onValueChange={setSelectedDept}>
          <SelectTrigger className="w-full h-14 bg-[#f7f7fc] text-right" dir="rtl">
            <SelectValue placeholder="בחרי מחלקה מהרשימה" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => router.push(`/survey/${selectedDept}`)}
          disabled={!selectedDept}
          className="w-full h-14 mt-6 bg-[#2a7c7c] text-white font-bold"
        >
          התחל סקר
        </Button>

        <div className="mt-12 pt-6 border-t">
          <Link href="/admin/login" className="text-sm text-gray-400 hover:text-[#2a7c7c]">כניסת צוות</Link>
        </div>
      </div>
    </div>
  )
}
