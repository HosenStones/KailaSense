'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/firebase/auth-context'
import { useRouter } from 'next/navigation'
import type { AdminUser } from '@/lib/types'

interface AdminHeaderProps {
  user: AdminUser | null
  title: string
  onSettingsClick?: () => void
}

export function AdminHeader({ user, title, onSettingsClick }: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  return (
    <header className="bg-gradient-to-r from-[#2a7c7c] to-[#3d9e9e] h-14 flex items-center justify-between px-6 sticky top-0 z-50" dir="rtl">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors">
          <Image src="/images/kaila-logo-horizontal.png" alt="Kaila" width={100} height={30} className="h-6 w-auto" />
        </Link>
        {/* Adjusted style to match user/signout buttons */}
        <span className="text-white text-sm font-semibold border-r border-white/20 pr-4">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Clicking here will now trigger the settings tab */}
        <button 
          onClick={onSettingsClick}
          className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#7dd3d3] flex items-center justify-center text-xs font-bold text-[#1e4a40]">
            {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
          </div>
          <span className="text-white text-sm font-semibold">{user?.fullName || 'משתמש'}</span>
        </button>
        <Button variant="ghost" onClick={handleSignOut} className="text-white/80 hover:text-white hover:bg-white/15 text-sm border border-white/25 rounded-lg px-3 py-1.5 h-auto">
          יציאה
        </Button>
      </div>
    </header>
  )
}
