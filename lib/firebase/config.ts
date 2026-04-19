import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbcso_YRXnD7r3hZB9XZgapRualmMyPDw",
  authDomain: "kaila-7fe41.firebaseapp.com",
  projectId: "kaila-7fe41",
  storageBucket: "kaila-7fe41.firebasestorage.app",
  messagingSenderId: "936710809739",
  appId: "1:936710809739:web:81c97608c50f79d70bcc8e",
  measurementId: "G-4ELNCVQ8ZX"
};

// Initialize Firebase once
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Direct exports - Firebase SDK handles the environment check internally
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;
