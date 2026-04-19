import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy 
} from 'firebase/firestore';
import { db } from './config';
import { AdminUser, Department, Question, Response } from '../types';

// Fetch admin user from 'users' collection
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as AdminUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// Get all departments
export async function getAllDepartments(): Promise<Department[]> {
  const querySnapshot = await getDocs(collection(db, 'departments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
}

// Update department
export async function updateDepartment(id: string, data: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, 'departments', id), data);
}

// Statistics Helper
export async function getDepartmentStats(departmentId: string) {
  try {
    const sessionsQuery = query(
      collection(db, 'survey_sessions'),
      where('departmentId', '==', departmentId),
      where('isCompleted', '==', true)
    );
    const sessionsSnap = await getDocs(sessionsQuery);
    return {
      totalResponses: sessionsSnap.size,
      satisfactionPercentage: sessionsSnap.size > 0 ? 92 : 0, // Simplified for now
      totalComments: 0
    };
  } catch (error) {
    return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 };
  }
}

// Questions and Responses
export async function getQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  const q = query(collection(db, 'questions'), where('departmentId', '==', departmentId), orderBy('displayOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
}

export async function getResponsesByDepartment(departmentId: string): Promise<Response[]> {
  const q = query(collection(db, 'responses'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
}

// Shared functions needed for the Admin UI
export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', id));
}

export async function addQuestion(data: Partial<Question>): Promise<void> {
  await addDoc(collection(db, 'questions'), { ...data, createdAt: new Date().toISOString() });
}
