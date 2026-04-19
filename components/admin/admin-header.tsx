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
  // Callback to handle navigation to the settings tab
  onProfileClick?: () => void 
  gradientClass?: string
}

export function AdminHeader({ 
  user, 
  title, 
  onProfileClick, 
  gradientClass = "from-[#2a7c7c] to-[#3d9e9e]" 
}: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  return (
    <header className={`bg-gradient-to-r ${gradientClass} h-14 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm`} dir="rtl">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-colors">
          <Image src="/images/kaila-logo-horizontal.png" alt="Kaila" width={100} height={30} className="h-6 w-auto" />
        </Link>
        <span className="text-white/70 text-sm border-r border-white/20 pr-4">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 hover:bg-white/25 transition-all text-right"
          type="button"
        >
          <div className="w-7 h-7 rounded-full bg-[#7dd3d3] flex items-center justify-center text-xs font-bold text-[#1e4a40]">
            {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
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
