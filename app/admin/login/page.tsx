'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/firebase/auth-context'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push('/admin')
    } catch {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eeedf9] to-[#e4faf5] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image
            src="/images/kaila-logo-horizontal.png"
            alt="Kaila Sense"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>
        <p className="text-center text-[#a8a6c4] text-sm mb-8">ממשק ניהול</p>

        <h2 className="text-xl font-bold text-[#1e1c4a] text-center mb-6">כניסה למערכת</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#6b6890] mb-2">אימייל</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hospital.org.il"
              className="w-full px-4 py-3 bg-[#f7f7fc] border-[#e8e7f5] rounded-xl focus:border-[#2ecfaa] focus:ring-[#2ecfaa]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#6b6890] mb-2">סיסמה</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#f7f7fc] border-[#e8e7f5] rounded-xl focus:border-[#2ecfaa] focus:ring-[#2ecfaa]"
              required
            />
          </div>

          {error && (
            <p className="text-[#e83f8a] text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3d3a9e] hover:bg-[#302d8a] text-white font-bold py-4 text-base rounded-xl transition-colors"
          >
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </Button>
        </form>

        <p className="text-center text-[#a8a6c4] text-xs mt-6">
          לצורכי דמו: צור משתמש ב-Firebase Authentication
        </p>
      </div>
    </div>
  )
}
