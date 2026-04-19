import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore'
import { db } from './config'
import type { Department, Question, SurveySession, Response as SurveyResponse, AdminUser } from '../types'

// Helper to convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | string | undefined): string => {
  if (!timestamp) return new Date().toISOString()
  if (typeof timestamp === 'string') return timestamp
  return timestamp.toDate().toISOString()
}

// Departments
export async function getDepartment(id: string): Promise<Department | null> {
  if (!db) return null
  const docRef = doc(db, 'departments', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  const data = docSnap.data()
  return {
    id: docSnap.id,
    name: data.name,
    nameEn: data.nameEn,
    logoUrl: data.logoUrl,
    createdAt: toISOString(data.createdAt),
    updatedAt: toISOString(data.updatedAt),
  }
}

export async function getAllDepartments(): Promise<Department[]> {
  if (!db) return []
  const querySnapshot = await getDocs(collection(db, 'departments'))
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      nameEn: data.nameEn,
      logoUrl: data.logoUrl,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
}

// Questions
export async function getQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  if (!db) return []
  const q = query(
    collection(db, 'questions'),
    where('departmentId', '==', departmentId),
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      departmentId: data.departmentId,
      questionText: data.questionText,
      questionType: data.questionType,
      options: data.options,
      isRequired: data.isRequired ?? true,
      isDefault: data.isDefault ?? false,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
}

export async function getAllQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  if (!db) return []
  const q = query(
    collection(db, 'questions'),
    where('departmentId', '==', departmentId),
    orderBy('displayOrder', 'asc')
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      departmentId: data.departmentId,
      questionText: data.questionText,
      questionType: data.questionType,
      options: data.options,
      isRequired: data.isRequired ?? true,
      isDefault: data.isDefault ?? false,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
}

export async function addQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = await addDoc(collection(db, 'questions'), {
    ...question,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = doc(db, 'questions', id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  await deleteDoc(doc(db, 'questions', id))
}

export async function reorderQuestions(questionIds: string[]): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  const batch = writeBatch(db)
  questionIds.forEach((id, index) => {
    const docRef = doc(db, 'questions', id)
    batch.update(docRef, { displayOrder: index, updatedAt: Timestamp.now() })
  })
  await batch.commit()
}

// Survey Sessions
export async function createSurveySession(departmentId: string, source?: string): Promise<string> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = await addDoc(collection(db, 'survey_sessions'), {
    departmentId,
    startedAt: Timestamp.now(),
    isCompleted: false,
    source: source || 'link',
    deviceInfo: typeof window !== 'undefined' ? {
      userAgent: navigator.userAgent,
      language: navigator.language,
    } : null,
  })
  return docRef.id
}

export async function completeSurveySession(sessionId: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = doc(db, 'survey_sessions', sessionId)
  await updateDoc(docRef, {
    isCompleted: true,
    completedAt: Timestamp.now(),
  })
}

// Responses
export async function saveResponse(response: Omit<SurveyResponse, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not initialized')
  
  // Remove undefined values - Firebase doesn't accept them
  const cleanResponse: Record<string, unknown> = {
    sessionId: response.sessionId,
    questionId: response.questionId,
    createdAt: Timestamp.now(),
  }
  
  if (response.answerValue !== undefined) {
    cleanResponse.answerValue = response.answerValue
  }
  if (response.answerValues !== undefined && response.answerValues.length > 0) {
    cleanResponse.answerValues = response.answerValues
  }
  if (response.answerText !== undefined && response.answerText.trim() !== '') {
    cleanResponse.answerText = response.answerText
  }
  
  const docRef = await addDoc(collection(db, 'responses'), cleanResponse)
  return docRef.id
}

export async function getResponsesBySession(sessionId: string): Promise<SurveyResponse[]> {
  if (!db) return []
  const q = query(
    collection(db, 'responses'),
    where('sessionId', '==', sessionId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      sessionId: data.sessionId,
      questionId: data.questionId,
      answerValue: data.answerValue,
      answerValues: data.answerValues,
      answerText: data.answerText,
      createdAt: toISOString(data.createdAt),
    }
  })
}

// Statistics helpers
export async function getSessionsByDepartment(departmentId: string, startDate?: Date, endDate?: Date): Promise<SurveySession[]> {
  if (!db) return []
  let q = query(
    collection(db, 'survey_sessions'),
    where('departmentId', '==', departmentId),
    orderBy('startedAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  let sessions = querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      departmentId: data.departmentId,
      startedAt: toISOString(data.startedAt),
      completedAt: data.completedAt ? toISOString(data.completedAt) : undefined,
      isCompleted: data.isCompleted ?? false,
      deviceInfo: data.deviceInfo,
      source: data.source,
    }
  })
  
  // Filter by date range if provided
  if (startDate) {
    sessions = sessions.filter(s => new Date(s.startedAt) >= startDate)
  }
  if (endDate) {
    sessions = sessions.filter(s => new Date(s.startedAt) <= endDate)
  }
  
  return sessions
}

export async function getResponsesByDepartment(departmentId: string): Promise<SurveyResponse[]> {
  if (!db) return []
  
  // First get all sessions for the department
  const sessions = await getSessionsByDepartment(departmentId)
  const sessionIds = sessions.map(s => s.id)
  
  if (sessionIds.length === 0) return []
  
  // Get responses for these sessions (in batches of 10 due to Firestore 'in' limit)
  const allResponses: SurveyResponse[] = []
  for (let i = 0; i < sessionIds.length; i += 10) {
    const batchIds = sessionIds.slice(i, i + 10)
    const q = query(
      collection(db, 'responses'),
      where('sessionId', 'in', batchIds)
    )
    const querySnapshot = await getDocs(q)
    const responses = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        sessionId: data.sessionId,
        questionId: data.questionId,
        answerValue: data.answerValue,
        answerValues: data.answerValues,
        answerText: data.answerText,
        createdAt: toISOString(data.createdAt),
      }
    })
    allResponses.push(...responses)
  }
  
  return allResponses
}

// ============ Admin User Management ============

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  if (!db) return null
  const docRef = doc(db, 'admin_users', uid)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  const data = docSnap.data()
  return {
    id: docSnap.id,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    departmentId: data.departmentId,
    createdAt: toISOString(data.createdAt),
    updatedAt: toISOString(data.updatedAt),
  }
}

export async function createAdminUser(uid: string, user: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  await setDoc(doc(db, 'admin_users', uid), {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateAdminUser(uid: string, updates: Partial<AdminUser>): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = doc(db, 'admin_users', uid)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteAdminUser(uid: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  await deleteDoc(doc(db, 'admin_users', uid))
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  if (!db) return []
  const querySnapshot = await getDocs(collection(db, 'admin_users'))
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      departmentId: data.departmentId,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
}

export async function getAdminUsersByDepartment(departmentId: string): Promise<AdminUser[]> {
  if (!db) return []
  const q = query(
    collection(db, 'admin_users'),
    where('departmentId', '==', departmentId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      departmentId: data.departmentId,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  })
}

// ============ Department Management ============

export async function createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = await addDoc(collection(db, 'departments'), {
    ...department,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  const docRef = doc(db, 'departments', id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteDepartment(id: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  // Also delete all questions and sessions for this department
  const batch = writeBatch(db)
  
  // Delete department
  batch.delete(doc(db, 'departments', id))
  
  // Delete questions
  const questionsQuery = query(collection(db, 'questions'), where('departmentId', '==', id))
  const questionsSnapshot = await getDocs(questionsQuery)
  questionsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
  
  // Delete sessions
  const sessionsQuery = query(collection(db, 'survey_sessions'), where('departmentId', '==', id))
  const sessionsSnapshot = await getDocs(sessionsQuery)
  sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
  
  await batch.commit()
}

// Copy default questions to a new department
export async function copyDefaultQuestionsToDepartment(targetDepartmentId: string, sourceDepartmentId?: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized')
  
  // Get questions from source department or use default questions
  const sourceId = sourceDepartmentId || 'internal-medicine' // Default source
  const q = query(
    collection(db, 'questions'),
    where('departmentId', '==', sourceId),
    where('isDefault', '==', true)
  )
  const querySnapshot = await getDocs(q)
  
  const batch = writeBatch(db)
  querySnapshot.docs.forEach((docSnap, index) => {
    const data = docSnap.data()
    const newDocRef = doc(collection(db, 'questions'))
    batch.set(newDocRef, {
      departmentId: targetDepartmentId,
      questionText: data.questionText,
      questionType: data.questionType,
      options: data.options || null,
      isRequired: data.isRequired ?? true,
      isDefault: true,
      displayOrder: index,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  })
  
  await batch.commit()
}

// Get department statistics for thank you page
export async function getDepartmentStats(departmentId: string): Promise<{
  totalResponses: number
  satisfactionPercentage: number
  totalComments: number
}> {
  if (!db) return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 }
  
  try {
    // Get completed sessions count
    const sessionsQuery = query(
      collection(db, 'survey_sessions'),
      where('departmentId', '==', departmentId),
      where('isCompleted', '==', true)
    )
    const sessionsSnapshot = await getDocs(sessionsQuery)
    const totalResponses = sessionsSnapshot.size
    
    if (totalResponses === 0) {
      return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 }
    }
    
    // Get all responses for satisfaction calculation
    const sessionIds = sessionsSnapshot.docs.map(d => d.id)
    let allResponses: { answerValue?: number; answerText?: string }[] = []
    
    for (let i = 0; i < sessionIds.length; i += 10) {
      const batchIds = sessionIds.slice(i, i + 10)
      const responsesQuery = query(
        collection(db, 'responses'),
        where('sessionId', 'in', batchIds)
      )
      const responsesSnapshot = await getDocs(responsesQuery)
      allResponses = allResponses.concat(
        responsesSnapshot.docs.map(d => ({
          answerValue: d.data().answerValue,
          answerText: d.data().answerText
        }))
      )
    }
    
    // Calculate satisfaction (answers 4 or 5 out of 5)
    const ratingResponses = allResponses.filter(r => r.answerValue !== undefined && r.answerValue >= 1 && r.answerValue <= 5)
    const satisfiedResponses = ratingResponses.filter(r => r.answerValue! >= 4)
    const satisfactionPercentage = ratingResponses.length > 0 
      ? Math.round((satisfiedResponses.length / ratingResponses.length) * 100)
      : 0
    
    // Count text comments
    const totalComments = allResponses.filter(r => r.answerText && r.answerText.trim().length > 0).length
    
    return { totalResponses, satisfactionPercentage, totalComments }
  } catch (error) {
    console.error('Error getting department stats:', error)
    return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 }
  }
}
