import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, setDoc, writeBatch, limit, orderBy
} from 'firebase/firestore';
import { db } from './config';
import { AdminUser, Department, Question, Response } from '../types';

// Utility function to remove undefined fields from objects before Firestore operations
const sanitizeData = (data: any) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
};

// Admin Auth and User Management
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as AdminUser;
  } catch (error) {
    console.error("Firestore Auth Error:", error);
    return null;
  }
}

export async function getAllAdminUsersSorted(departments: Department[]): Promise<AdminUser[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
  return users;
}

export async function getUsersByDepartment(departmentId: string): Promise<AdminUser[]> {
  const q = query(collection(db, 'users'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
}

// Department Management
export async function getAllDepartments(): Promise<Department[]> {
  const querySnapshot = await getDocs(collection(db, 'departments'));
  const depts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  return depts.sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

export async function createDepartment(data: Partial<Department>): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), { 
    ...sanitizeData(data), 
    createdAt: new Date().toISOString() 
  });
  return docRef.id;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, 'departments', id), sanitizeData(data));
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', id));
}

// Admin Management
export async function createAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { 
    ...sanitizeData(data), 
    createdAt: new Date().toISOString() 
  });
}

export async function updateAdminUser(uid: string, data: Partial<AdminUser>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), sanitizeData(data));
}

export async function deleteAdminUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

// Question Management
export async function getQuestionsByDepartment(departmentId: string): Promise<Question[]> {
  const q = query(collection(db, 'questions'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  return questions.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export async function addQuestion(data: Partial<Question>): Promise<void> {
  await addDoc(collection(db, 'questions'), { 
    ...sanitizeData(data), 
    isActive: true, 
    createdAt: new Date().toISOString() 
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
    batch.set(doc(collection(db, 'questions')), { ...d.data(), departmentId, isDefault: false, createdAt: new Date().toISOString() });
  });
  await batch.commit();
}

// Analytics and Real Statistics Calculation
export async function getDepartmentStats(departmentId: string) {
  try {
    // Get completed sessions
    const sessionsQuery = query(collection(db, 'survey_sessions'), where('departmentId', '==', departmentId), where('isCompleted', '==', true));
    const sessionsSnap = await getDocs(sessionsQuery);
    const totalSessions = sessionsSnap.size;

    // Get all responses for this department
    const responsesQuery = query(collection(db, 'responses'), where('departmentId', '==', departmentId));
    const responsesSnap = await getDocs(responsesQuery);
    const responses = responsesSnap.docs.map(doc => doc.data() as Response);

    // Calculate total text comments
    const textResponses = responses.filter(r => r.answerText && r.answerText.trim().length > 0);
    const totalComments = textResponses.length;

    // Calculate real satisfaction percentage based on numeric ratings (1-5)
    const ratingResponses = responses.filter(r => r.answerValue && !isNaN(Number(r.answerValue)));
    let satisfactionPercentage = 0;
    if (ratingResponses.length > 0) {
      const sum = ratingResponses.reduce((acc, r) => acc + Number(r.answerValue), 0);
      const avg = sum / ratingResponses.length;
      satisfactionPercentage = Math.round((avg / 5) * 100);
    }

    // Calculate average completion time in seconds
    let avgTimeSeconds = 0;
    if (totalSessions > 0) {
      const times = sessionsSnap.docs.map(doc => {
        const data = doc.data();
        if (data.startedAt && data.completedAt) {
          return new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime();
        }
        return 0;
      }).filter(t => t > 0);
      
      if (times.length > 0) {
        avgTimeSeconds = Math.round((times.reduce((a,b) => a+b, 0) / times.length) / 1000);
      }
    }

    return { 
      totalResponses: totalSessions, 
      satisfactionPercentage, 
      totalComments,
      avgTimeSeconds
    };
  } catch (error) {
    console.error("Failed to calculate stats:", error);
    return { totalResponses: 0, satisfactionPercentage: 0, totalComments: 0, avgTimeSeconds: 0 };
  }
}

export async function getResponsesByDepartment(departmentId: string): Promise<Response[]> {
  const q = query(collection(db, 'responses'), where('departmentId', '==', departmentId));
  const snap = await getDocs(q);
  // Sort descending by creation date
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Survey Session Logic for Patients
export async function createSurveySession(departmentId: string, source?: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'survey_sessions'), {
    departmentId,
    source: source || 'link',
    startedAt: new Date().toISOString(),
    isCompleted: false
  });
  return docRef.id;
}

export async function saveResponse(data: {
  sessionId: string;
  departmentId: string;
  questionId: string;
  answerValue?: string;
  answerValues?: string[];
  answerText?: string;
}): Promise<void> {
  await addDoc(collection(db, 'responses'), { 
    ...sanitizeData(data), 
    createdAt: new Date().toISOString() 
  });
}

export async function completeSurveySession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'survey_sessions', sessionId), { 
    isCompleted: true, 
    completedAt: new Date().toISOString() 
  });
}
