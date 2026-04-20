'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAllDepartments } from '@/lib/firebase/firestore'
import type { Department } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [step, setStep] = useState<1 | 2>(1)
  const router = useRouter()

  useEffect(() => {
    getAllDepartments().then(setDepartments)
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e8e7f5] p-8 text-center">
        
        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Image src="/images/kaila-logo-vertical.png" alt="KailaSense" width={120} height={80} className="mx-auto mb-6 h-16 w-auto" priority />
            <h1 className="text-3xl font-bold text-[#1e1c4a] mb-2">ברוכים הבאים!</h1>
            <div className="text-4xl mb-4 mt-2">❤️</div>
            <p className="text-[#6b6890] mb-10 text-lg">המשוב שלך מסייע לנו להשתפר.</p>
            <Button onClick={() => setStep(2)} className="w-full h-14 bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold text-lg rounded-xl transition-all shadow-md">
              התחל סקר
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <Image src="/images/kaila-logo-vertical.png" alt="KailaSense" width={120} height={80} className="mx-auto mb-8 h-16 w-auto" priority />
            <h1 className="text-2xl font-bold mb-8 text-[#1e1c4a]">באיזו מחלקה ביקרת?</h1>

            <Select onValueChange={setSelectedDept}>
              <SelectTrigger className="w-full h-14 bg-[#f7f7fc] border-[#e8e7f5] text-right rounded-xl text-lg font-medium" dir="rtl">
                <SelectValue placeholder="בחר מחלקה מהרשימה" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {departments.map(dept => <SelectItem key={dept.id} value={dept.id} className="text-right">{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => router.push(`/survey/${selectedDept}`)}
              disabled={!selectedDept}
              className="w-full h-14 mt-6 bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold text-lg rounded-xl"
            >
              המשך
            </Button>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-[#e8e7f5]">
          <Link href="/admin/login" className="text-sm text-[#a8a6c4] hover:text-[#2a7c7c] transition-colors">כניסת צוות</Link>
        </div>
      </div>
    </div>
  )
}
