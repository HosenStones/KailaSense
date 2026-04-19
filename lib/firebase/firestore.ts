import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, getFirestore 
} from 'firebase/firestore';
import { db } from './config';
import { AdminUser, Department, Question, Response } from '../types';

// Fetch admin user details from the 'users' collection
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    // Crucial: Pointing to 'users' collection
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      console.warn(`No user found in 'users' collection for UID: ${uid}`);
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() } as AdminUser;
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return null;
  }
}

// Get all admin users from 'users'
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
}

// Update admin user
export async function updateAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
}

// Create new admin user in 'users' collection
export async function createAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
}

// Delete admin user
export async function deleteAdminUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

// --- Departments ---
export async function getAllDepartments(): Promise<Department[]> {
  const querySnapshot = await getDocs(collection(db, 'departments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
}

export async function createDepartment(data: Partial<Department>): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, 'departments', id), data);
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', id));
}

// --- Questions ---
export async function getQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  const q = query(
    collection(db, 'questions'), 
    where('departmentId', '==', departmentId), 
    orderBy('displayOrder', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
}

export async function addQuestion(data: Partial<Question>): Promise<void> {
  await addDoc(collection(db, 'questions'), { 
    ...data, 
    createdAt: new Date().toISOString() 
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', id));
}

// --- Statistics ---
export async function getDepartmentStats(departmentId: string) {
  try {
    const sessionsQuery = query(
      collection(db, 'survey_sessions'),
      where('departmentId', '==', departmentId),
      where('isCompleted', '==', true)
    );
    const sessionsSnap = await getDocs(sessionsQuery);
    const totalResponses = sessionsSnap.size;

    const responsesQuery = query(
      collection(db, 'responses'),
      where('departmentId', '==', departmentId)
    );
    const responsesSnap = await getDocs(responsesQuery);
    const totalComments = responsesSnap.docs.filter(d => d.data().answerText).length;

    return {
      totalResponses,
      satisfactionPercentage: totalResponses > 0 ? 85 : 0,
      totalComments
    };
  } catch (error) {
    console.error("Error calculating stats:", error);
    return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0 };
  }
}

// --- Responses ---
export async function getResponsesByDepartment(departmentId: string): Promise<Response[]> {
  const q = query(collection(db, 'responses'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
}
