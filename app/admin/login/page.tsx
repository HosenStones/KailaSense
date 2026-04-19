'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signIn } from '@/lib/firebase/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.push('/admin')
    } catch (err: any) {
      setError('פרטי התחברות שגויים. אנא נסי שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full border-[#e8e7f5] shadow-sm">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <Image 
              src="/images/kaila-logo-vertical.png" 
              alt="KailaSense" 
              width={140} 
              height={100} 
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1e1c4a]">כניסה למערכת</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e1c4a]">אימייל</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e1c4a]">סיסמה</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
            </div>
            {error && <div className="text-sm text-red-500 text-center">{error}</div>}
            <Button type="submit" className="w-full bg-[#2a7c7c] py-6 text-lg font-bold" disabled={isLoading}>
              {isLoading ? 'מתחבר...' : 'כניסה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
