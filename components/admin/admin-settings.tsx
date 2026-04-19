'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDepartment, updateDepartment, createAdminUser } from '@/lib/firebase/firestore'
import type { Department } from '@/lib/types'

export function AdminSettings({ departmentId }: { departmentId: string }) {
  const [dept, setDept] = useState<Department | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // New user state
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')

  useEffect(() => {
    async function loadDept() {
      if (!departmentId) return
      const data = await getDepartment(departmentId)
      setDept(data)
    }
    loadDept()
  }, [departmentId])

  const handleSaveDept = async () => {
    if (!dept) return
    setIsSaving(true)
    try {
      await updateDepartment(dept.id, {
        name: dept.name,
        managerName: dept.managerName,
        managerEmail: dept.managerEmail
      })
      alert('Changes saved successfully')
    } catch (e) {
      console.error(e)
      alert('Error saving changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return
    setIsSaving(true)
    try {
      const tempId = `user_${Date.now()}`
      await createAdminUser(tempId, {
        fullName: newUserName,
        email: newUserEmail,
        role: 'admin',
        departmentId: departmentId
      })
      setNewUserName('')
      setNewUserEmail('')
      alert('User added successfully')
    } catch (e) {
      alert('Error adding user')
    } finally {
      setIsSaving(false)
    }
  }

  if (!dept) return <div className="p-8 text-center text-[#6b6890]">Loading settings...</div>

  return (
    <div className="space-y-8" dir="rtl">
      {/* Department Info Section */}
      <section className="bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm">
        <h3 className="text-lg font-bold text-[#1e1c4a] mb-6">General Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6b6890]">Department Name</label>
            <Input 
              value={dept.name} 
              onChange={e => setDept({...dept, name: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6b6890]">WhatsApp Status</label>
            <div className="p-3 bg-[#f7f7fc] border border-[#e8e7f5] rounded-lg text-sm text-[#a8a6c4]">
              Not connected
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6b6890]">Manager Name</label>
            <Input 
              value={dept.managerName || ''} 
              onChange={e => setDept({...dept, managerName: e.target.value})} 
              placeholder="e.g. Dr. Sara Levi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6b6890]">Manager Email</label>
            <Input 
              value={dept.managerEmail || ''} 
              onChange={e => setDept({...dept, managerEmail: e.target.value})} 
              dir="ltr"
            />
          </div>
        </div>
        <Button 
          onClick={handleSaveDept} 
          disabled={isSaving}
          className="mt-6 bg-[#2a7c7c] hover:bg-[#236969] text-white"
        >
          Save Department Changes
        </Button>
      </section>

      {/* User Management Section */}
      <section className="bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm">
        <h3 className="text-lg font-bold text-[#1e1c4a] mb-4">Add Department Users</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Full Name" 
            value={newUserName} 
            onChange={e => setNewUserName(e.target.value)} 
          />
          <Input 
            placeholder="Email Address" 
            value={newUserEmail} 
            onChange={e => setNewUserEmail(e.target.value)} 
            dir="ltr"
          />
          <Button 
            onClick={handleAddUser} 
            disabled={isSaving}
            className="bg-[#3d3a9e] hover:bg-[#2e2b85] text-white whitespace-nowrap"
          >
            Add User
          </Button>
        </div>
      </section>
    </div>
  )
}
