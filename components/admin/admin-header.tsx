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
    <header className="bg-white border-b border-[#e8e7f5] px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm" dir="rtl">
      
      {/* Logo & Title Area */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image 
            src="/images/kaila-logo-horizontal.png" 
            alt="KailaSense" 
            width={110} 
            height={36} 
            className="h-8 w-auto object-contain" 
            priority
          />
        </Link>
        <div className="h-6 w-[2px] bg-[#e8e7f5] mx-1 rounded-full"></div>
        <h1 className="text-lg font-bold text-[#1e1c4a] tracking-tight">{title}</h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {user && (
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 hover:bg-[#f7f7fc] p-1.5 pr-3 rounded-xl transition-all border border-transparent hover:border-[#e8e7f5]"
          >
            <div className="text-right hidden md:block leading-tight">
              <div className="text-sm font-bold text-[#1e1c4a]">{user.fullName}</div>
              <div className="text-xs text-[#2a7c7c] font-medium mt-0.5">{user.role === 'super_admin' ? 'סופר אדמין' : 'מנהל'}</div>
            </div>
            <div className="w-9 h-9 bg-[#f0f9f9] border border-[#2a7c7c]/20 rounded-full flex items-center justify-center text-[#2a7c7c] shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout} 
          className="text-[#a8a6c4] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
          title="התנתק"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
