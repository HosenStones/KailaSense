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
  writeBatch
} from 'firebase/firestore'
import { db } from './config'
import type { Department, Question, SurveySession, Response as SurveyResponse } from '../types'

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
  const docRef = await addDoc(collection(db, 'responses'), {
    ...response,
    createdAt: Timestamp.now(),
  })
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
