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
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 md:p-6" dir="rtl">
      <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl border border-border p-6 md:p-8 text-center">
        
        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Image src="/images/kaila-logo-vertical-white.png" alt="KailaSense" width={120} height={80} className="mx-auto mb-6 h-14 w-auto drop-shadow-md" priority />
            <h1 className="text-3xl font-bold text-card-foreground mb-2">ברוכים הבאים!</h1>
            
            <div className="text-4xl mb-4 mt-6">❤️</div>
            <p className="text-muted-foreground mb-8 text-lg px-2">המשוב שלך חשוב ומסייע לנו להשתפר.</p>
            
            <Button onClick={() => setStep(2)} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all shadow-md">
              התחל סקר
            </Button>

            {/* Informational Badges for Patients */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full border border-primary/20">⏱️ מתחת ל-2 דק'</span>
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full border border-primary/20">🕵️‍♀️ אנונימי לחלוטין</span>
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full border border-primary/20">🔓 ללא צורך בהרשמה</span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <Image src="/images/kaila-logo-vertical-white.png" alt="KailaSense" width={120} height={80} className="mx-auto mb-8 h-14 w-auto drop-shadow-md" priority />
            <h1 className="text-2xl font-bold mb-8 text-card-foreground">באיזו מחלקה ביקרת?</h1>

            <Select onValueChange={setSelectedDept}>
              <SelectTrigger className="w-full h-14 bg-background border-border text-foreground text-right rounded-xl text-lg font-medium focus:ring-primary" dir="rtl">
                <SelectValue placeholder="בחר מחלקה מהרשימה" />
              </SelectTrigger>
              <SelectContent dir="rtl" className="max-h-60 bg-popover border-border">
                {departments.map(dept => <SelectItem key={dept.id} value={dept.id} className="text-right text-base py-3 text-popover-foreground">{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => router.push(`/survey/${selectedDept}`)}
              disabled={!selectedDept}
              className="w-full h-14 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all"
            >
              המשך
            </Button>
            
            <button onClick={() => setStep(1)} className="mt-4 text-muted-foreground text-sm hover:text-card-foreground transition-colors">
              חזרה
            </button>
          </div>
        )}

        <div className="mt-10 pt-5 border-t border-border">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">כניסה לממשק הניהול</Link>
        </div>
      </div>
    </div>
  )
}
