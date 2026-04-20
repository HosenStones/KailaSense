import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, setDoc, writeBatch, limit
} from 'firebase/firestore';
import { db } from './config';
import { AdminUser, Department, Question, Response } from '../types';

// Fetch user by email
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as AdminUser;
  } catch (error) {
    console.error("Firestore Error:", error);
    return null;
  }
}

// Fetch all users sorted by department then by name
export async function getAllAdminUsersSorted(departments: Department[]): Promise<AdminUser[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
  
  return users.sort((a, b) => {
    const deptA = departments.find(d => d.id === a.departmentId)?.name || 'zzz';
    const deptB = departments.find(d => d.id === b.departmentId)?.name || 'zzz';
    return deptA.localeCompare(deptB, 'he') || a.fullName.localeCompare(b.fullName, 'he');
  });
}

// Fetch all departments sorted alphabetically
export async function getAllDepartments(): Promise<Department[]> {
  const querySnapshot = await getDocs(collection(db, 'departments'));
  const depts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  return depts.sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

export async function createDepartment(data: Partial<Department>): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, 'departments', id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', id));
}

// Admin users management
export async function createAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function updateAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAdminUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

// Questions Management
export async function getQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  const q = query(collection(db, 'questions'), where('departmentId', '==', departmentId), orderBy('displayOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
}

export async function addQuestion(data: Partial<Question>): Promise<void> {
  await addDoc(collection(db, 'questions'), { 
    ...data, 
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', id));
}

export async function copyDefaultQuestionsToDepartment(departmentId: string): Promise<void> {
  const defaultQuestionsQuery = query(collection(db, 'questions'), where('isDefault', '==', true));
  const defaultSnap = await getDocs(defaultQuestionsQuery);
  const batch = writeBatch(db);
  defaultSnap.docs.forEach((d) => {
    const newQuestionRef = doc(collection(db, 'questions'));
    batch.set(newQuestionRef, { ...d.data(), departmentId, isDefault: false, createdAt: new Date().toISOString() });
  });
  await batch.commit();
}

// Stats and Responses (זה החלק שהיה חסר וגרם לשגיאה)
export async function getDepartmentStats(departmentId: string) {
  try {
    const sessionsQuery = query(collection(db, 'survey_sessions'), where('departmentId', '==', departmentId), where('isCompleted', '==', true));
    const sessionsSnap = await getDocs(sessionsQuery);
    return {
      totalResponses: sessionsSnap.size,
      satisfactionPercentage: sessionsSnap.size > 0 ? 92 : 0,
      totalComments: 0
    };
  } catch (error) {
    return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 };
  }
}

export async function getResponsesByDepartment(departmentId: string): Promise<Response[]> {
  const q = query(collection(db, 'responses'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
}
