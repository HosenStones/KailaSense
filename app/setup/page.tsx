'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'check' | 'create' | 'done'>('check')
  const [status, setStatus] = useState<{
    hasDepartments: boolean
    hasUsers: boolean
    departmentCount: number
    userCount: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      })
      const data = await res.json()
      setStatus(data)
      
      if (data.hasDepartments && data.hasUsers) {
        setStep('done')
      } else {
        setStep('create')
      }
    } catch (err) {
      console.error('Error checking status:', err)
      setError('שגיאה בבדיקת המצב')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!auth) {
        throw new Error('Firebase not initialized')
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create admin user and department in Firestore
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup',
          userUid: user.uid,
          userEmail: email,
          userFullName: fullName,
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      setStep('done')
    } catch (err) {
      console.error('Setup error:', err)
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המשתמש')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && step === 'check') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex items-center justify-center">
        <div className="text-[#2a7c7c]">בודק מצב המערכת...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f7f7fc] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e7f5] px-4 py-3 text-center">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila Sense"
            width={120}
            height={40}
            className="h-8 w-auto mx-auto"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-[#e8e7f5]">
          
          {step === 'done' ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-[#1e1c4a] mb-2">המערכת מוכנה!</h1>
              <p className="text-[#6b6890] mb-6">
                {status?.departmentCount || 1} מחלקות, {status?.userCount || 1} משתמשים
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/admin">
                  <Button className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold py-3 rounded-xl">
                    כניסה לממשק המנהלים
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full border-[#2a7c7c] text-[#2a7c7c] font-bold py-3 rounded-xl">
                    חזרה לסקר
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1e1c4a] mb-2 text-center">
                הגדרת המערכת
              </h1>
              <p className="text-sm text-[#6b6890] mb-6 text-center">
                צור את משתמש ה-Super Admin הראשון
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSetup} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1e1c4a] mb-1">
                    שם מלא
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    required
                    className="w-full rounded-xl border-[#e8e7f5] py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1e1c4a] mb-1">
                    אימייל
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    required
                    className="w-full rounded-xl border-[#e8e7f5] py-3"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1e1c4a] mb-1">
                    סיסמה
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    required
                    minLength={6}
                    className="w-full rounded-xl border-[#e8e7f5] py-3"
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold py-4 rounded-xl mt-2"
                >
                  {isLoading ? 'יוצר משתמש...' : 'צור משתמש ומחלקה ראשונה'}
                </Button>
              </form>

              <p className="text-xs text-[#a8a6c4] text-center mt-4">
                פעולה זו תיצור את משתמש ה-Super Admin הראשון ומחלקה לדוגמה
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
