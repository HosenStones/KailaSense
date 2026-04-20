'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/admin')
    } catch (err: any) {
      console.error(err)
      setError('פרטי התחברות שגויים. אנא נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e8e7f5] p-8">
        
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image 
              src="/images/kaila-logo-vertical.png" 
              alt="KailaSense Admin" 
              width={100} 
              height={80} 
              className="h-16 w-auto mb-6" 
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1e1c4a]">כניסת מנהלים</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-[#1e1c4a] px-1">אימייל</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="h-12 border-[#e8e7f5] focus:ring-[#2a7c7c]"
              dir="ltr"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-[#1e1c4a] px-1">סיסמה</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="h-12 border-[#e8e7f5] focus:ring-[#2a7c7c]"
              dir="ltr"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-14 bg-[#2a7c7c] hover:bg-[#236969] text-white font-bold text-lg rounded-xl mt-6 transition-all"
          >
            {isLoading ? 'מתחבר...' : 'התחבר למערכת'}
          </Button>
        </form>
        
        <div className="mt-8 text-center border-t border-[#e8e7f5] pt-6">
           <Link href="/" className="text-sm text-[#a8a6c4] hover:text-[#2a7c7c] transition-colors font-medium">
             חזרה לעמוד הראשי של הסקר
           </Link>
        </div>
      </div>
    </div>
  )
}
