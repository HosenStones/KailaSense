'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './config'

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  departmentId: string | null
}

interface AuthContextType {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, departmentId?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !auth) return

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // Fetch admin user data from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'admin_users', firebaseUser.uid))
          if (adminDoc.exists()) {
            const data = adminDoc.data()
            setAdminUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              fullName: data.fullName || '',
              role: data.role || 'admin',
              departmentId: data.departmentId || null,
            })
          } else {
            setAdminUser(null)
          }
        } catch (error) {
          console.error('Error fetching admin user:', error)
          setAdminUser(null)
        }
      } else {
        setAdminUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, fullName: string, departmentId?: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized')
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Create admin user document
    await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
      email,
      fullName,
      role: 'admin',
      departmentId: departmentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const signOut = async () => {
    if (!auth) throw new Error('Firebase not initialized')
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export standalone auth functions for use outside of context
export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOut() {
  if (!auth) throw new Error('Firebase not initialized')
  return firebaseSignOut(auth)
}
