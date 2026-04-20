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
      setError('פרטי התחברות שגויים. אנא נסה שנית.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7fc] flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full border-[#e8e7f5] shadow-sm">
        <CardHeader className="space-y-4 text-center pb-8">
          <Image src="/images/kaila-logo-vertical.png" alt="KailaSense" width={120} height={80} className="mx-auto h-16 w-auto" />
          <CardTitle className="text-2xl font-bold text-[#1e1c4a]">כניסה למערכת</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">אימייל</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">סיסמה</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border">{error}</div>}
            <Button type="submit" disabled={isLoading} className="w-full bg-[#2a7c7c] py-6 text-lg font-bold">
              {isLoading ? 'מתחבר...' : 'כניסה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
