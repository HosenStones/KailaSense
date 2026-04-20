'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase/config'
import { signOut } from 'firebase/auth'
import { LogOut, User } from 'lucide-react'
import type { AdminUser } from '@/lib/types'

interface AdminHeaderProps {
  user: AdminUser | null;
  title: string;
  onProfileClick: () => void;
}

export function AdminHeader({ user, title, onProfileClick }: AdminHeaderProps) {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/admin/login';
  }

  return (
    <header className="bg-[#2a7c7c] px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-md" dir="rtl">
      
      {/* Logo & Title Area */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity bg-white p-1.5 rounded-lg shadow-sm">
          <Image 
            src="/images/kaila-logo-horizontal.png" 
            alt="KailaSense" 
            width={100} 
            height={32} 
            className="h-7 w-auto object-contain" 
            priority
          />
        </Link>
        <div className="h-6 w-[2px] bg-white/20 mx-1 rounded-full"></div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {user && (
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 hover:bg-white/10 p-1.5 pr-3 rounded-xl transition-all"
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-white">{user.fullName}</div>
              {/* השורה של התפקיד הוסרה כבקשתך */}
            </div>
            <div className="w-9 h-9 bg-white border border-white/20 rounded-full flex items-center justify-center text-[#2a7c7c] shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout} 
          className="text-white hover:bg-red-500/20 hover:text-white rounded-xl transition-colors" 
          title="התנתק"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
