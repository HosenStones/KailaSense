'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit2, Save, X, Clock, Settings, UserPlus, Activity, Plus, Trash2 } from 'lucide-react'

interface AdminSchedulingProps {
  departmentId: string;
  isReadOnly?: boolean;
}

const DEFAULT_TIMINGS = {
  admission: { value: '30', unit: 'דקות אחרי', isActive: 'פעיל', label: '👋 קבלה למחלקה' },
  during: { value: '12', unit: 'שעות אחרי', isActive: 'פעיל', label: '🛏️ מהלך אשפוז' },
  discharge: { value: '1', unit: 'שעות לפני', isActive: 'פעיל', label: '🏠 לקראת שחרור' },
  after_discharge: { value: '24', unit: 'שעות אחרי', isActive: 'פעיל', label: '⏱️ לאחר שחרור' }
};

export function AdminScheduling({ departmentId, isReadOnly = false }: AdminSchedulingProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  const [timingSettings, setTimingSettings] = useState<any>(DEFAULT_TIMINGS);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', escortPhone: '', status: 'admission' });
  
  // טיימר לעדכון חי של הזמנים כל דקה
  const [now, setNow] = useState(Date.now());
  useEffect(() => { 
    const timer = setInterval(() => setNow(Date.now()), 60000); 
    return () => clearInterval(timer); 
  }, []);

  useEffect(() => {
    if (!departmentId) return;

    const fetchTimings = async () => {
      const deptDoc = await getDoc(doc(db, 'departments', departmentId));
      const dbTimings = deptDoc.exists() ? deptDoc.data().timing
